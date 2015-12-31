/* global google */
define(function (require) {

    "use strict";

    var _ = require('underscore');
    var Handlebars = require('handlebars');
    var Marionette = require('marionette');

    var rad = function (x) {
        return x * Math.PI / 180;
    };

    function calculateDistance(lat1, lon1, lat2, lon2) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = rad(lat2 - lat1);
        var dLong = rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return (d / 1000).toFixed(); // returns the distance in kiloometer
    }

    var MapView = Marionette.ItemView.extend({
        id: 'map-view',
        template: Handlebars.compile(""),
        initialize: function (opts) {
            this.lat = opts.lat;
            this.lng = opts.lng;
            this.markersArray = [];
            this.data = '';
        },
        highlightMarker: function (eatery_id) {
            var self = this;
            this.unhighlightMarker();
            _.each(this.markersArray, function (marker, i) {
				if (marker.get('restaurant_id') === eatery_id) {
					if (self.animationMarker) {
						self.animationMarker.setAnimation(null);
						self.animationMarker = '';
					}
					marker.setAnimation(google.maps.Animation.BOUNCE);
					self.animationMarker = marker;
				}
            });
        },
        unhighlightMarker: function (eatery_id) {
            if (this.animationMarker) {
                this.animationMarker.setAnimation(null);
                this.animationMarker = '';
            }
        },
        clearOldMarkers: function () {
            _.each(this.markersArray, function (marker) {
                marker.setMap(null);
            });
            self.markersArray = [];
        },
        updateMarkers: function (data) {
            this.collection = data;
            self.data = data.toJSON();
            this.showMarker();
        },
        showMarker: function () {
            var self = this;
            var markersBound = new google.maps.LatLngBounds();
            this.clearOldMarkers();

            _.each(self.data, function (datum) {
				var markerLatLngObject = '';
				var distance = 0;
				if (datum.eatery_details) {
					markerLatLngObject = new google.maps.LatLng(datum.eatery_details.eatery_longitude_latitude[0], datum.eatery_details.eatery_longitude_latitude[1]);
					distance = +calculateDistance(self.lat, self.lng, datum.eatery_details.eatery_longitude_latitude[0], datum.eatery_details.eatery_longitude_latitude[1]);
				} else {
					markerLatLngObject = new google.maps.LatLng(datum.location[1], datum.location[0]);
					distance = +calculateDistance(self.lat, self.lng, datum.location[1], datum.location[0]);
				}

				var isExistBefore = false;
				// check if previous marker with same restaurant id is not created before
				_.each(self.markersArray, function (marker, i) {
					if (marker.get('restaurant_id') === datum.__eatery_id) {
						isExistBefore = true;
						return;
					}
				});

				if (isExistBefore) {
					return;
				}

				var address = datum.eatery_details ? datum.eatery_details.eatery_address : datum.eatery_address;
                var googleMapMarker = new google.maps.Marker({
                    map: self.map,
                    icon: './css/images/restaurant-marker.jpg',
                    position: markerLatLngObject,
                    title: datum.eatery_name,
                    restaurant_name: datum.eatery_name,
                    restaurant_id: datum.__eatery_id,
                    food_name: datum.food_name,
                    distance: distance,
                    category: datum.category,
                    address: address,
                    html: "<div id='infobox'>" + datum.eatery_name + "<br />" + address + "</div>"
                });

                google.maps.event.addListener(googleMapMarker, 'mouseover', function () {
                    self.infoWindow.setContent(this.get('html'));
                    self.triggerMethod('highlight:restaurant', this.get('restaurant_id'));
                    self.infoWindow.open(self.map, this);
                });

                google.maps.event.addListener(googleMapMarker, 'mouseout', function () {
                    self.triggerMethod('unhighlight:restaurant', this.get('restaurant_id'));
                    self.infoWindow.close();
                });

                google.maps.event.addListener(googleMapMarker, 'click', function () {
                    var marker_id = this.get('restaurant_id');
                    self.triggerMethod('show:restaurant', marker_id, datum);
                });

				self.oms.addMarker(googleMapMarker);


                self.markersArray.push(googleMapMarker);
                markersBound.extend(markerLatLngObject);

            });

            this.map.fitBounds(markersBound);
        },
        onShow: function () {
            var self = this;
            require(["r-async!http://maps.googleapis.com/maps/api/js", 'oms'], function (map, OverlappingMarkerSpiderfier) {
				var mapCanvas = document.getElementById("map-view");
                var centerPoint = new google.maps.LatLng(self.lat, self.lng);

                var mapOptions = {
                    center: centerPoint,
                    zoom: 16,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: true,
                    styles: [
                        {
                            "featureType": "all", "elementType": "all",
							"stylers": [{ "invert_lightness": true }, { "hue": "#ff1a00" }, { "saturation": -100 }, { "lightness": 33 }, { "gamma": 0.5 }]
                        },
                        {
                            "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#2D333C" }]
                        }
                    ]
                }

                self.map = new google.maps.Map(mapCanvas, mapOptions);

                self.myLocationMarker = new google.maps.Marker({
                    map: self.map,
                    position: centerPoint,
                    title: "My Location"
                });

                self.infoWindow = new google.maps.InfoWindow({ content: "", });

				self.oms = new OverlappingMarkerSpiderfier(self.map);

				self.oms.addListener('click', function (marker, event) {
					self.infoWindow.setContent(marker.html);
					self.infoWindow.open(self.map, marker);
				});

                self.data = self.collection.toJSON();

                self.showMarker();
            });
        }
    });

    return MapView;
});