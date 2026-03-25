const MapController = ({ onMark, isLocked, gps }) => {
  const map = useMap();

  useEffect(() => {
    if (gps && isLocked) {
      map.flyTo([gps.lat, gps.lon], 17, { animate: true });
    }
  }, [gps, isLocked, map]);

  useEffect(() => {
    if (map.pm) {
      map.pm.addControls({
        position: 'topleft',
        drawMarker: true,
        drawCircle: false,
        drawCircleMarker: false,
        drawPolygon: false,
        drawPolyline: false,
        drawRectangle: false,
        drawText: false,
        editMode: false,
        dragMode: false,
        cutPolygon: false,
        removalMode: true,
        rotateMode: false,
      });
    }

    return () => {
      if (map.pm) {
        map.pm.removeControls();
      }
    };
  }, [map]);

  useMapEvents({
    click(e) {
      onMark(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};