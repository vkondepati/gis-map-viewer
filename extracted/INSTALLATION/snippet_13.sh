# # Extracted from INSTALLATION.md (fence #13, lang='bash')
# Build Docker image
docker build -t gis-map-viewer .

# Run container with X11 forwarding (Linux)
docker run -it \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $HOME/maps:/data \
  gis-map-viewer

# Run container (macOS)
docker run -it \
  -e DISPLAY=host.docker.internal:0 \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $HOME/maps:/data \
  gis-map-viewer
