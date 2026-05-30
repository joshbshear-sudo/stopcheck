FROM node:20-alpine
WORKDIR /app

# Python 3 + runtime deps for the StopCheck engine.
# geos is the runtime library for shapely; geos-dev guards against wheel-build
# fallbacks. python symlink covers processFit.js spawning `python` (not python3).
RUN apk add --no-cache python3 py3-pip geos geos-dev && \
    ln -sf /usr/bin/python3 /usr/bin/python

# Node dependencies
COPY api/package*.json ./
RUN npm ci

# Node application
COPY api/ ./

# Python detection engine.
# Lives at /engine to match ENGINE_DIR resolution in src/jobs/processFit.js
# (`../../../engine` from /app/src/jobs/). `-e` installs in-place + pulls
# transitive deps (fitparse, geopy, shapely, gpxpy) per engine/pyproject.toml.
COPY engine/ /engine/
RUN pip3 install --break-system-packages --no-cache-dir -e /engine

EXPOSE 3000
CMD ["node", "src/server.js"]
