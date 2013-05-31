Node utility intended to work with config files, but it could have other uses.
It works with the first object expression it finds.

#API

### get(filePath, function(err, config, data) {})

gets the config as an object along with some other data

### modify(filePath, function(err, config, save = function(config, callback)) {})

gets the config as an object along with an async save callback

### getAsStream(filePath [, subObject])

returns the config as a write stream ([streams2](http://blog.nodejs.org/2012/12/20/streams2/) supported).
It will get the config, modify it and save it to filesystem once end() is called.

subObject is optional and indicates the subobject you will be writing to, defaults to the root, see below for example.

#Usage

```javascript
require("config-mancer").modify("scripts/rjs-config.js", function(err, config, save) {
  config.paths.jquery = "vendor/jquery.js";
  save(config, function(err) {
    // file saved
  });
});
```

```javascript
var config = require("config-mancer").getAsStream("scripts/rjs-config.js", "paths")
config.write(["jquery", "vendor/jquery.js"]); // will write to paths.jquery
config.on("fileWritten", function(err) {
  // file saved
});
```
