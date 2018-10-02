(function (undefined) {

    'use strict';


    var mapFusion = function (cfg, lyrs) {
        //var self = this;
        var config = new MapConfigSetup();
        config = extend(config, cfg);


        // TGOS電子地圖
        var tgosLayer = createXyzLayer("tgos", getLayerVisible(lyrs, 'tgos'), tgosTileUrlFunction);
        // 通用版電子地圖
        var nlscLayer = createWmtsLayer("nlsc", config.mapUrl.nlsc, getLayerVisible(lyrs, 'nlsc'), "EMAP");
        // 通用版正射影像
        var orthoLayer = createWmtsLayer("ortho", config.mapUrl.nlsc, getLayerVisible(lyrs, 'sate'), "PHOTO2");
        // OpenStreetMap
        var osmLayer = createOsmLayer('', getLayerVisible(lyrs, 'osm'));

        function getLayerVisible(layers, type) {
            var visible = false;
            var filterd = layers.filter(function (d) { return d.type === type });
            if (filterd.length > 0) {
                visible = filterd[0].active;
            }
            return visible;
        }
        var baseLayers = [{
            type: 'osm',
            name: 'OSM',
            group: 'base',
            active: false,
            isBaseLayer: true,
            opacity: 1,
            source: osmLayer
        }, {
            type: 'tgos',
            name: 'TGOS',
            group: 'base',
            active: true,
            isBaseLayer: true,
            opacity: 1,
            source: tgosLayer
        }, {
            type: 'nlsc',
            name: '通用版',
            group: 'base',
            active: false,
            isBaseLayer: true,
            opacity: 1,
            source: nlscLayer
        }, {
            type: 'sate',
            name: '航照圖',
            group: 'base',
            active: false,
            isBaseLayer: true,
            source: orthoLayer
        }];

        function createLayers(opt) {
            var layers = [];
            opt.forEach(function (d) {
                var filterd = baseLayers.filter(function (l) { return l.type === d.type });
                if (filterd.length > 0) {
                    var layer = filterd[0];
                    layer.name = d.name;
                    layer.active = d.active;
                    layers.push(layer);
                }
            });
            return layers;

        }
        config.layers = createLayers(lyrs);

        function layerChangeControl(opts) {

            var options = opts || {};
            var element = document.createElement('div');
            element.className = 'rt-control';

            var createRtButton = function (name, style, evt) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'btn ' + style + ' btn-sm';
                b.innerHTML = name;
                b.style.margin = '2px;';
                b.addEventListener('click', evt, false);
                return b;
            };

            function changeButtonStatus(evt) {
                $('.rt-control button').removeClass('btn-primary').addClass('btn-default');
                $(evt.target).removeClass('btn-default').addClass('btn-primary');
                config.layers.forEach(function (layer) {
                    if (layer.isBaseLayer) {
                        layer.source.setVisible(layer.name === evt.target.innerHTML);
                    }
                });
            }

            config.layers.forEach(function (d) {
                if (d.isBaseLayer) {
                    element.appendChild(
                        createRtButton(d.name, d.active ? 'btn-primary' : 'btn-default', changeButtonStatus)
                    );
                }
            });
            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });
        };
        ol.inherits(layerChangeControl, ol.control.Control);


        var map = new ol.Map({
            controls: ol.control.defaults({
                attribution: false
            }).extend([
                new layerChangeControl()
            ]),
            target: config.target,
            interactions: ol.interaction.defaults({
                doubleClickZoom: false // 將預設雙擊 zoom function 關閉
            }),
            layers: [
                tgosLayer,
                nlscLayer,
                orthoLayer,
                osmLayer
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([config.center.lon, config.center.lat]),
                zoom: config.center.zoom
            })
        });




        function createOsmLayer(url, visible) {
            url = url || 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png';

            return new ol.layer.Tile({
                visible: visible,
                source: new ol.source.OSM({
                    url: url
                })
            })
        }

        function extend(a, b) {
            for (var key in b)
                if (b.hasOwnProperty(key))
                    a[key] = b[key];
            return a;
        }

        function MapConfigSetup() {
            var epsg = 'EPSG:3857';
            var projection = ol.proj.get(epsg);
            var projectionExtent = projection.getExtent();
            var size = ol.extent.getWidth(projectionExtent) / 256;
            var resolutions = new Array(20);
            var matrixIds = new Array(20);
            for (var z = 0; z < 20; ++z) {
                resolutions[z] = size / Math.pow(2, z);
                matrixIds[z] = z;
            }

            return {
                epsg: epsg,
                center: {
                    lon: 120.339940,
                    lat: 23.173398,
                    zoom: 11
                },
                target: "map",
                projection: projection,
                projectionExtent: projectionExtent,
                resolutions: resolutions,
                matrixIds: matrixIds,
                mapUrl: {
                    tgos: 'https://api.tgos.nat.gov.tw/TileAgent/TGOSMAP_W.aspx/GetCacheImage?APPID=x+JLVSx85Lk=&APIKEY=in8W74q0ogpcfW/STwicK8D5QwCdddJf05/7nb+OtDh8R99YN3T0LurV4xato3TpL/fOfylvJ9Wv/khZEsXEWxsBmg+GEj4AuokiNXCh14Rei21U5GtJpIkO++Mq3AguFK/ISDEWn4hMzqgrkxNe1Q==&L=0',
                    nlsc: 'https://maps.nlsc.gov.tw/S_Maps/wmts'
                }
            };
        }

        function createXyzLayer(name, visible, tileUrlFunction) {
            var layer = new ol.layer.Tile({
                name: name,
                visible: visible,
                extent: config.projectionExtent,
                source: new ol.source.XYZ({
                    crossOrigin: 'anonymous',
                    tileUrlFunction: tileUrlFunction
                })
            });
            return layer;
        }

        function tgosTileUrlFunction(tileCoord) {
            //var p = "&X=" + tileCoord[1] + "&Y=" + (-(tileCoord[2]) - 1) + "&S=" + (20 - tileCoord[0] - 1);
            //return mapConfig.mapUrl.tgos + p;
            var p = 'http://api.tgos.nat.gov.tw/TileAgent/TGOSMAP_W.aspx/GetCacheImage?APPID=x+JLVSx85Lk=&APIKEY=in8W74q0ogpcfW/STwicK8D5QwCdddJf05/7nb+OtDh8R99YN3T0LurV4xato3TpL/fOfylvJ9Wv/khZEsXEWxsBmg+GEj4AuokiNXCh14Rei21U5GtJpIkO++Mq3AguFK/ISDEWn4hMzqgrkxNe1Q==&L=0' +
                '&X=' + tileCoord[1] + '&Y=' + tileCoord[2] + '&S=' + (20 - tileCoord[0] - 1);
            return p;
        }

        function createWmtsLayer(name, url, visible, layerName) {
            var layer = new ol.layer.Tile({
                name: name,
                opacity: 1,
                extent: config.projectionExtent,
                visible: visible,
                source: new ol.source.WMTS({
                    //crossOrigin: 'anonymous',
                    url: url,
                    matrixSet: "EPSG:3857",
                    format: "image/png",
                    projection: config.projection,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: ol.extent.getTopLeft(config.projectionExtent),
                        resolutions: config.resolutions,
                        matrixIds: config.matrixIds
                    }),
                    layer: layerName
                })
            });
            return layer;
        }



        return map;
    }

    window.MapFusion = mapFusion;

})();