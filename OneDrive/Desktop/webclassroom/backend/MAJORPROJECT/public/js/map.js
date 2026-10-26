const mapContainer = document.getElementById("map");

if (mapContainer) {
    const mapToken =
        mapContainer.dataset.mapToken;

    const listingCoordinates =
        JSON.parse(
            mapContainer.dataset.coordinates
        );

    const listingTitle =
        mapContainer.dataset.title;

    const listingLocation =
        mapContainer.dataset.location;

    console.log(
        "Listing Coordinates:",
        listingCoordinates
    );

    mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: listingCoordinates,
        zoom: 12
    });

    new mapboxgl.Marker()
        .setLngLat(listingCoordinates)
        .setPopup(
            new mapboxgl.Popup({
                offset: 25
            }).setHTML(`
                <h6>${listingTitle}</h6>
                <p>${listingLocation}</p>
            `)
        )
        .addTo(map);

    map.addControl(
        new mapboxgl.NavigationControl()
    );

    map.on("load", () => {
        map.resize();
    });
}