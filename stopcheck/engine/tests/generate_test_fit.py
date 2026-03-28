"""Generate a synthetic FIT file for end-to-end testing.

Creates a minimal but valid FIT binary that simulates a gravel ride
passing through 3 stop signs — one pass, one guard-waived, one fail.

Stop sign locations (matching e2e test):
  Stop 1: 40.8000, -96.6700  — rider makes a full 4-second stop (PASS)
  Stop 2: 40.8100, -96.6800  — crossing guard posted (GUARD_WAIVED)
  Stop 3: 40.8200, -96.6900  — rider rolls through at ~4 mph (FAIL)
"""

import json
import struct
import sys
from datetime import datetime, timedelta
from pathlib import Path


# FIT protocol constants
FIT_EPOCH_OFFSET = 631065600  # seconds between Unix epoch and FIT epoch (1989-12-31)

MESG_FILE_ID = 0
MESG_RECORD = 20

FIELD_TYPE = 0       # file_id.type
FIELD_TIMESTAMP = 253
FIELD_POSITION_LAT = 0
FIELD_POSITION_LONG = 1
FIELD_SPEED = 6
FIELD_ENHANCED_SPEED = 73


def deg_to_semicircles(deg):
    return int(deg * (2**31 / 180.0))


def datetime_to_fit(dt):
    return int(dt.timestamp()) - FIT_EPOCH_OFFSET


def write_fit_file(output_path, records):
    """Write a minimal valid FIT file with the given records."""
    # Build data records first, then wrap with header
    data = bytearray()

    # Definition message for file_id (message 0)
    data += _definition_message(local_id=0, global_mesg=MESG_FILE_ID, fields=[
        (FIELD_TYPE, 1, 0),  # type: enum (1 byte)
    ])
    # Data message: file_id.type = 4 (activity)
    data += _data_message(local_id=0, values=[4])

    # Definition message for record (message 20)
    data += _definition_message(local_id=1, global_mesg=MESG_RECORD, fields=[
        (FIELD_TIMESTAMP, 4, 134),       # uint32
        (FIELD_POSITION_LAT, 4, 133),    # sint32
        (FIELD_POSITION_LONG, 4, 133),   # sint32
        (FIELD_ENHANCED_SPEED, 4, 134),  # uint32 (scale 1000)
        (FIELD_SPEED, 2, 132),           # uint16 (scale 1000)
    ])

    # Data messages for each record
    for rec in records:
        ts = datetime_to_fit(rec['timestamp'])
        lat = deg_to_semicircles(rec['lat'])
        lon = deg_to_semicircles(rec['lon'])
        speed_ms = rec['speed']  # m/s
        enhanced = int(speed_ms * 1000)  # scale 1000
        speed_16 = min(int(speed_ms * 1000), 65535)

        data += _data_message(local_id=1, values=[
            ts, lat, lon, enhanced, speed_16,
        ], formats=['<I', '<i', '<i', '<I', '<H'])

    # CRC placeholder
    crc = _crc16(data)

    # FIT file header (14 bytes)
    header_size = 14
    data_size = len(data)
    protocol_version = 0x20  # 2.0
    profile_version = 2132   # 21.32
    data_type = b'.FIT'

    header = struct.pack('<BBHI4s', header_size, protocol_version,
                         profile_version, data_size, data_type)
    header_crc = _crc16(header)
    header += struct.pack('<H', header_crc)

    with open(output_path, 'wb') as f:
        f.write(header)
        f.write(data)
        f.write(struct.pack('<H', crc))

    return output_path


def _definition_message(local_id, global_mesg, fields):
    """Build a FIT definition message."""
    msg = bytearray()
    # Record header: bit 6 = definition (0x40)
    msg += struct.pack('B', 0x40 | (local_id & 0x0F))
    msg += struct.pack('B', 0)  # reserved
    msg += struct.pack('B', 0)  # architecture: little-endian
    msg += struct.pack('<H', global_mesg)
    msg += struct.pack('B', len(fields))
    for field_num, size, base_type in fields:
        msg += struct.pack('BBB', field_num, size, base_type)
    return msg


def _data_message(local_id, values, formats=None):
    """Build a FIT data message."""
    msg = bytearray()
    msg += struct.pack('B', local_id & 0x0F)
    if formats:
        for val, fmt in zip(values, formats):
            msg += struct.pack(fmt, val)
    else:
        for val in values:
            msg += struct.pack('B', val)
    return msg


def _crc16(data):
    """CRC-16 used by FIT protocol."""
    crc_table = [
        0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
        0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
    ]
    crc = 0
    for byte in data:
        tmp = crc_table[crc & 0xF]
        crc = (crc >> 4) & 0x0FFF
        crc = crc ^ tmp ^ crc_table[byte & 0xF]
        tmp = crc_table[crc & 0xF]
        crc = (crc >> 4) & 0x0FFF
        crc = crc ^ tmp ^ crc_table[(byte >> 4) & 0xF]
    return crc


def generate_ride_records():
    """Generate synthetic GPS+speed records simulating a gravel ride through 3 stops."""
    records = []
    base_time = datetime(2026, 6, 15, 9, 0, 0)  # Within event window

    # Segment 1: Approach stop 1 at 40.8000, -96.6700
    # Approach from south, slow down, full stop for 4 seconds
    t = base_time
    lat, lon = 40.7990, -96.6700

    # Riding at ~7 m/s (~15 mph) toward stop
    for i in range(20):
        records.append({'timestamp': t, 'lat': lat, 'lon': lon, 'speed': 7.0})
        t += timedelta(seconds=1)
        lat += 0.00005

    # Decelerating into stop zone
    for speed in [5.0, 3.0, 1.5, 0.5, 0.1]:
        records.append({'timestamp': t, 'lat': 40.80000, 'lon': -96.6700, 'speed': speed})
        t += timedelta(seconds=1)

    # Full stop — 4 seconds at 0 speed (PASS: >= 3s required)
    for i in range(4):
        records.append({'timestamp': t, 'lat': 40.80001, 'lon': -96.6700, 'speed': 0.0})
        t += timedelta(seconds=1)

    # Accelerate away
    for speed in [0.5, 2.0, 4.0, 6.0, 7.0]:
        records.append({'timestamp': t, 'lat': 40.8001 + 0.00005 * records.index(records[-1]), 'lon': -96.6700, 'speed': speed})
        t += timedelta(seconds=1)
        lat = 40.8002

    # Segment 2: Transit to stop 2 at 40.8100, -96.6800
    lat = 40.8010
    for i in range(60):
        records.append({'timestamp': t, 'lat': lat, 'lon': lon, 'speed': 7.0})
        t += timedelta(seconds=1)
        lat += 0.00015
        lon -= 0.00017

    # Approach stop 2 — crossing guard posted, rider rolls through at ~2 m/s
    # (GUARD_WAIVED because crossing_guard=true and within event window)
    for i in range(5):
        records.append({'timestamp': t, 'lat': 40.81000 + i * 0.00001, 'lon': -96.6800, 'speed': 2.0})
        t += timedelta(seconds=1)

    # Transit to stop 3 at 40.8200, -96.6900
    lat = 40.8110
    lon = -96.6810
    for i in range(60):
        records.append({'timestamp': t, 'lat': lat, 'lon': lon, 'speed': 7.0})
        t += timedelta(seconds=1)
        lat += 0.00015
        lon -= 0.00017

    # Segment 3: Stop 3 — rider rolls through at ~1.8 m/s (~4 mph)
    # This is a FAIL — never drops below 0.5 mph threshold
    for i in range(5):
        records.append({'timestamp': t, 'lat': 40.82000 + i * 0.00001, 'lon': -96.6900, 'speed': 1.8})
        t += timedelta(seconds=1)

    # Cool-down riding
    for i in range(10):
        records.append({'timestamp': t, 'lat': 40.8210, 'lon': -96.6910, 'speed': 5.0})
        t += timedelta(seconds=1)

    return records


def generate_json_records(output_path):
    """Generate JSON input format (for Strava streams path)."""
    records = generate_ride_records()
    json_records = [
        {
            "timestamp": r["timestamp"].isoformat(),
            "lat": r["lat"],
            "lon": r["lon"],
            "speed": r["speed"],
            "speed_source": "sensor",
        }
        for r in records
    ]
    with open(output_path, 'w') as f:
        json.dump(json_records, f, indent=2)
    return output_path


if __name__ == "__main__":
    output_dir = Path(__file__).parent.parent / "tests" / "fixtures"
    output_dir.mkdir(exist_ok=True)

    # Generate binary FIT file
    records = generate_ride_records()
    fit_path = output_dir / "synthetic_ride.fit"
    write_fit_file(str(fit_path), records)
    print(f"Generated FIT file: {fit_path} ({fit_path.stat().st_size} bytes)")

    # Generate JSON input
    json_path = output_dir / "synthetic_ride.json"
    generate_json_records(str(json_path))
    print(f"Generated JSON input: {json_path}")

    # Generate stop signs JSON
    stops = [
        {"id": "stop-1", "event_id": "e2e", "sequence": 1,
         "lat": 40.8000, "lon": -96.6700, "location": "Hwy 6 & CR 110",
         "crossing_guard": False},
        {"id": "stop-2", "event_id": "e2e", "sequence": 2,
         "lat": 40.8100, "lon": -96.6800, "location": "W Van Dorn & SW 27th",
         "crossing_guard": True},
        {"id": "stop-3", "event_id": "e2e", "sequence": 3,
         "lat": 40.8200, "lon": -96.6900, "location": "Pioneers Blvd & S 56th",
         "crossing_guard": False},
    ]
    stops_path = output_dir / "test_stops.json"
    with open(stops_path, 'w') as f:
        json.dump(stops, f, indent=2)
    print(f"Generated stops JSON: {stops_path}")

    print("\nDone. Run the engine with:")
    print(f"  python -m stopcheck_engine.cli --fit {json_path} --json-input --stops {stops_path} --output report.json")
