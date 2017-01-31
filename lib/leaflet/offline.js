(function (window, L) {
  var isDebug = true; // false;
  var StorageTileLayer = L.TileLayer.extend({

    log: function (text) {
      if (!isDebug)
        return;
      if (this.options.log)
        this.options.log(text);
      else
        console.log("[StorageTileLayer]: " + text);
    },
    _setUpTile: function (tile, key, value, cache) {
      try {
        tile._layer = this;
        tile.onload = this._tileOnLoad;
        tile.onerror = this._tileOnError;

        this._adjustTilePoint(tile);
        tile.src = value;
        this.fire('tileloadstart', {
          tile: tile,
          url: tile.src
        });
      }
      catch (e) {
        this.log("ERROR in setUpTile: " + e.message);
      }
    },

    _loadTile: function (tile, tilePoint) {
      this._adjustTilePoint(tilePoint);
      var key = tilePoint.z + ',' + tilePoint.y + ',' + tilePoint.x;
      var self = this;
      var tileUrl = self.getTileUrl(tilePoint);
      if (isNaN(tilePoint.x) || isNaN(tilePoint.y)) {
        this.log("TilePoint x or y is nan: " + tilePoint.x + "-" + tilePoint.y);
        return;
      }
      if (this.options.storage) {
        this.options.storage.get(key, tileUrl).then(function (value) {
          self.log("Tile URL to load: " + value.url);
          self._setUpTile(tile, key, value.url, true);
        });
      } else {
        this.log("Load Tile without storage");
        self._setUpTile(tile, key, tileUrl, false);
      }
    }
  });

  window.StorageTileLayer = StorageTileLayer;
})(window, L);

    