var chai = require("chai"),
path = require("path"),
fs = require("fs-extra"),
expect = chai.expect,
should = chai.should(),
fixturePath = function(name) {
  return path.join("test", "fixtures", name);
},
fixtureContents = function(name) {
  return fs.readFileSync(fixturePath(name)).toString();
},
lib = require("../"),
copyFixture = function(name) {
  return function(done) {
    fs.copy(fixturePath(name), fixturePath("require-copy.js"), done);
  };
};

afterEach(function(done) {
  fs.remove(fixturePath("require-copy.js"), done);
});

describe("get()", function() {
  beforeEach(copyFixture("require.js"));

  it("works", function(done) {
    lib.get(fixturePath("require.js"), function(err, config) {
      config.paths.a.should.equal("path/to/a");
      done();
    });
  });

  it("works with json files", function(done) {
    lib.get(fixturePath("json.json"), function(err, config) {
      expect(config).exist.and.to.have.property("a");
      expect(config.a).to.equal(1);
      done();
    });
  });
});

describe("modify()", function() {
  beforeEach(copyFixture("require.js"));

  it("works", function(done) {
    lib.modify(fixturePath("require-copy.js"), function(err, config, save) {
      config.paths.b = "path/to/b";

      save(config, function(err) {
        fixtureContents("require-copy.js").should.equal(fixtureContents("require-expected.js"));
        done();
      });
    });
  });
});

describe("get() with empty config", function() {
  beforeEach(copyFixture('require-empty.js'));

  it("creates an empty config object in the callback", function(done) {
    lib.get(fixturePath("require-copy.js"), function(err, config, data) {
      expect(config).exist.and.to.be.an('object').and.to.be.empty;
      done();
    });
  });

  it("works", function(done) {
    lib.modify(fixturePath("require-copy.js"), function(err, config, save) {
      expect(config).exist.and.to.be.an('object').and.to.be.empty;

      config.paths = {
        a: "path/to/a",
        b: "path/to/b"
      };

      save(config, function(err) {
        fixtureContents("require-copy.js").should.equal(fixtureContents("require-expected.js"));
        done();
      });
    });
  });
});

describe("getAsStream()", function() {
  beforeEach(copyFixture("require.js"));

  it("works", function(done) {
    var stream = lib.getAsStream(fixturePath("require-copy.js"))
    .on("fileWritten", function() {
      fixtureContents("require-copy.js").should.equal(fixtureContents("require-expected.js"));
      done();
    });
    stream.write(["paths.b", "path/to/b"], null, function() {
      stream.end();
    });
  });

  it("has a property with the actual object", function(done) {
    lib.getAsStream(fixturePath("require-copy.js"))
    .on("fileLoaded", function() {
      this.should.have.property("object");
      this.object.should.have.property("paths");
      done();
    });
  });

  it("works with sub objects", function(done) {
    var stream = lib.getAsStream(fixturePath("require-copy.js"), "paths")
    .on("fileWritten", function() {
      fixtureContents("require-copy.js").should.equal(fixtureContents("require-expected.js"));
      done();
    });
    stream.write(["b", "path/to/b"], null, function() {
      stream.end();
    });
  });
});
