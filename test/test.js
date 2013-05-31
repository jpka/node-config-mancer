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
lib = require("../");

beforeEach(function(done) {
  fs.copy(fixturePath("require.js"), fixturePath("require-copy.js"), done);
});

afterEach(function(done) {
  fs.remove(fixturePath("require-copy.js"), done);
});

describe("get()", function() {
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

describe("getAsStream()", function() {
  it("works", function(done) {
    var stream = lib.getAsStream(fixturePath("require-copy.js"));
    stream.write(["paths.b", "path/to/b"], null, function() {
      stream.end();
    });
    stream.on("fileWritten", function() {
      fixtureContents("require-copy.js").should.equal(fixtureContents("require-expected.js"));
      done();
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
});


