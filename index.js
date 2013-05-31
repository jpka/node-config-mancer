var esprima = require("esprima"),
writableStream = require("stream").Writable,
fs = require("fs");

//Node v0.8 support
if (!writableStream) {
  writableStream = require("readable-stream").Writable;
}

function traverse(node, cb) {
  var shouldContinue = true;

  if (Array.isArray(node)) {
    node.forEach(function(x) {
      traverse(x, cb);
    });
  } else if (node && typeof node === "object") {
    shouldContinue = cb(node);
    if (!shouldContinue) return;

    Object.keys(node).forEach(function (key) {
      if (!node[key]) return;
      traverse(node[key], cb);
    });
  }
};

exports.get = function(filePath, cb) {
  var fileContents = fs.readFileSync(filePath).toString(),
  info = {
    src: fileContents
  };

  if (require("path").extname(filePath) === ".json" || fileContents[0] === "{") {
    info.str = info.src;
    try {
      return cb(null, eval("(" + info.str + ")"), info);
    } catch (e) {
      return cb(e);
    }
  }

  traverse(esprima.parse(fileContents, {range: true}), function(node) {
    if (node.type === "ObjectExpression") {
      info.str = fileContents.substring(node.range[0], node.range[1]);
      try {
        cb(null, eval("(" + info.str + ")"), info);
      } catch(e) {
        cb(e);
      }
      return false;
    }
    return true;
  });
};

exports.modify = function(filePath, cb) {
  exports.get(filePath, function(err, config, data) {
    var save;
    if (err) return cb(err);

    save = function(config, cb) {
      var str = require("stringify-object")(config, {
        indent: data.str.match(/\{[\r\n]+([ \t]+)/)[1],
        singleQuotes: false
      });
      fs.writeFile(filePath, data.src.replace(data.str, str), cb);
    };
    cb(null, config, save);
  });
};

exports.getAsStream = function(filePath) {
  var stream = new writableStream({objectMode: true});

  function onFileLoaded(cb) {
    if (stream.object) return cb();
    stream.on("fileLoaded", cb);
  };

  stream._write = function(data, encoding, callback) {
    onFileLoaded(function() {
      var keys = data[0].split("."),
      level = stream.object;

      keys.forEach(function(key, i) {
        if (i < keys.length - 1) {
          level = level[key];
          if (!level) level = level[key] = {};
        } else {
          level[key] = data[1];
        }
      });

      callback();
    });
  };

  exports.modify(filePath, function(err, config, save) {
    stream.object = config;
    //This happens way too fast
    process.nextTick(function() {
      stream.emit("fileLoaded");
    });
    stream.on("finish", function() {
      save(config, function(err) {
        if (err) return stream.emit("error", err);
        stream.emit("fileWritten");
      });
    });
  });

  return stream;
};
