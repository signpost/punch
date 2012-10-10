var fs = require("fs");
var path = require("path");

var cache_store = require("../lib/cache_store.js");

describe("setup", function(){

	it("set the output directory", function(){
		cache_store.setup({"output_dir": "output_dir"});
		expect(cache_store.outputDir).toEqual("output_dir");
	});

});

describe("stat", function(){

	it("call the callback with the file's modified time", function(){

		cache_store.outputDir = "output_dir";

		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			if(file_path === "output_dir/path/test.html"){
				return callback(null, {"mtime": new Date(2012, 6, 21), "size": 527});
			}
		});

		var spyCallback = jasmine.createSpy();
		cache_store.stat("path/test", ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "mtime": new Date(2012, 6, 21), "size": 527 });
	});

	it("call the callback with an error if file doesn't exist", function(){

		cache_store.outputDir = "output_dir";

		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		cache_store.stat("path/test", ".html", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error");

	});

});

describe("get", function(){

	it("read the file with the correct encoding", function() {
		var cached_content = new Buffer("cached content");

		cache_store.outputDir = "output_dir";

		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			return callback(null, { "mtime": new Date(2012, 6, 21), "size": 567 });
		});

		spyOn(fs, "readFile");

		var spyCallback = jasmine.createSpy();
		cache_store.get("path/test", ".html", { "options": { "header": { "custom-key": "custom-value" } } }, {}, spyCallback);

		expect(fs.readFile).toHaveBeenCalledWith("output_dir/path/test.html", "utf8", jasmine.any(Function));
	});

	it("call the callback with file content", function(){

		var cached_content = new Buffer("cached content");

		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			return callback(null, { "mtime": new Date(2012, 6, 21), "size": 567 });
		});

		spyOn(fs, "readFile").andCallFake(function(file_path, encoding, callback){
			return callback(null, cached_content);
		});

		var spyCallback = jasmine.createSpy();
		cache_store.get("path/test", ".html", { "options": { "header": { "custom-key": "custom-value" } } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": cached_content, "options": { "header": { "Content-Length": 14, "ETag": "\"567-1342809000000\"", "Last-Modified": "Fri, 20 Jul 2012 18:30:00 GMT", "custom-key": "custom-value" } } });

	});

	it("call the callback with the error if there's an error reading the file", function(){

		spyOn(fs, "stat").andCallFake(function(file_path, callback){
			return callback(null, { "mtime": new Date(2012, 6, 21), "size": 567 });
		});

		spyOn(fs, "readFile").andCallFake(function(file_path, encoding, callback){
			return callback("error", null);
		});

		var spyCallback = jasmine.createSpy();
		cache_store.get("path/test", ".html", { "options": { "header": {} } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", { "body": null, "options": { "header": { "Content-Length": 0, "ETag": "\"567-1342809000000\"", "Last-Modified": "Fri, 20 Jul 2012 18:30:00 GMT" } } });

	});

});

describe("update", function(){

	it("create missing directories", function(){
		spyOn(fs, "stat").andCallFake(function(dirpath, callback){
			return callback(null, {"isDirectory": function(){ return false }});
		});

		spyOn(fs, "mkdir").andCallFake(function(dirpath, callback){
			return callback(null);
		});

		spyOn(fs, "writeFile");

		cache_store.outputDir = "output_dir";

		var spyCallback = jasmine.createSpy();
		cache_store.update("path/subdir/test", ".html", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(fs.mkdir.callCount).toEqual(3);

	});

	it("write file to the correct path", function(){
		spyOn(fs, "stat").andCallFake(function(dirpath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(fs, "writeFile");

		var spyCallback = jasmine.createSpy();
		cache_store.update("path/subdir/test", ".html", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(fs.writeFile).toHaveBeenCalledWith("output_dir/path/subdir/test.html", "test", "utf8", jasmine.any(Function));
	});

	it("set the correct encoding", function(){
		spyOn(fs, "stat").andCallFake(function(dirpath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(fs, "writeFile");

		var spyCallback = jasmine.createSpy();
		cache_store.update("path/subdir/test", ".jpg", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(fs.writeFile).toHaveBeenCalledWith("output_dir/path/subdir/test.jpg", "test", "binary", jasmine.any(Function));
	});

	it("call the callback with the error if there's an error in writing the file", function(){
		spyOn(fs, "stat").andCallFake(function(dirpath, callback){
			return callback(null, {"isDirectory": function(){ return true }});
		});

		spyOn(fs, "writeFile").andCallFake(function(file_path, body, encoding, callback){
			return callback("error");
		});

		var spyCallback = jasmine.createSpy();
		cache_store.update("path/subdir/test", ".html", { "body": "test", "options": { "header": {} } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error");
	});

	it("call the callback a valid cache object", function(){

		spyOn(fs, "stat").andCallFake(function(dirpath, callback) {
			return callback(null, { "isDirectory": function(){ return true } });
		});

		spyOn(fs, "writeFile").andCallFake(function(file_path, body, encoding, callback) {
			return callback(null);
		});

		spyOn(cache_store, "stat").andCallFake(function(file_path, file_ext, options, callback) {
			return callback(null, {"mtime": new Date(2012, 6, 21), "size": 527});
		});

		var spyCallback = jasmine.createSpy();
		cache_store.update("path/subdir/test", ".html", { "body": "test", "options": { "header": { "Content-Type": "text/css", "Cache-Control": "public, max-age=0" } } }, {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, { "body": "test", "options": { "header": { "Content-Type": "text/css", "Cache-Control": "public, max-age=0", "Content-Length": 4, "ETag": "\"527-1342809000000\"", "Last-Modified": "Fri, 20 Jul 2012 18:30:00 GMT" } } });
	});

});

describe("clear", function() {

	it("remove all files (except hidden files)", function(done) {
		cache_store.outputDir = path.join(__dirname, "sample_directory");

		spyOn(fs, "rmdir").andCallFake(function(path, callback) {
			return callback();
		});

		spyOn(fs, "unlink").andCallFake(function(path, callback) {
			return callback();
		});

		var cb = function() {
			expect(fs.unlink.callCount).toEqual(3);
			done();
		};

		cache_store.clear(cb);
	});

	it("remove all directories (except hidden directories)", function(done) {
		cache_store.outputDir = path.join(__dirname, "sample_directory");

		spyOn(fs, "rmdir").andCallFake(function(path, callback) {
			return callback();
		});

		spyOn(fs, "unlink").andCallFake(function(path, callback) {
			return callback();
		});

		var cb = function() {
			expect(fs.rmdir.callCount).toEqual(1);
			done();
		};

		cache_store.clear(cb);
	});

});
