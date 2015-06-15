var AWS = require('aws-sdk');
var Fs = require("fs");
var Path = require("path");
var S3Publisher = require("../../lib/publishers/s3.js");

describe("calling publish", function() {

        it("get the details of the s3 bucket", function() {

            var supplied_config = { "output_dir": "public/" };

            spyOn(S3Publisher, "retrieveOptions").andReturn({ bucket: 'some-bucket' });
            spyOn(S3Publisher, "fetchAndCopyFiles");

            S3Publisher.publish(supplied_config);

            expect(S3Publisher.retrieveOptions).toHaveBeenCalledWith(supplied_config);

        });

    it("create a s3 client", function() {
        var supplied_config = { "output_dir": "public/" };
        var s3_config = { bucket: 'somebucket' };

        spyOn(S3Publisher, "retrieveOptions").andReturn(s3_config);
        expect(S3Publisher.bucket instanceof AWS.S3).toBe(true);
        spyOn(S3Publisher, "fetchAndCopyFiles");
        S3Publisher.publish(supplied_config);
    });

});

describe("retrieve the s3 options from the config", function() {

        it("return the s3 options defined in publish section of config", function() {
                var s3_config = { "bucket": "somebucket" };
                var supplied_config = { "publish": { "strategy": "s3", "options": s3_config } };

                expect(S3Publisher.retrieveOptions(supplied_config)).toEqual(s3_config);
        });

        it("throw an error if config doesn't contain options for s3", function() {
                var supplied_config = {"publish": { }};
                var error = "Cannot find s3 settings in config";

                expect(function() { S3Publisher.retrieveOptions(supplied_config) } ).toThrow(error);
        });

        it("throw an error if config doesn't define a publish section", function() {
                var supplied_config = {};
                var error = "Cannot find s3 settings in config";

                expect(function() { S3Publisher.retrieveOptions(supplied_config) } ).toThrow(error);
        });

});

describe("check if a file is modified", function() {

        it("return true if file modified date is newer than last published date", function() {
                S3Publisher.lastPublishedDate = new Date(2012, 6, 25);

                expect(S3Publisher.isModified(new Date(2012, 6, 30))).toEqual(true);
        });

});

describe("copy a file to s3 bucket", function() {

        it("read the given file", function() {
                var spy_callback = jasmine.createSpy();

                spyOn(Fs, "readFile");

                S3Publisher.copyFile("output_dir/file.html", spy_callback);

                expect(Fs.readFile.mostRecentCall.args[0]).toEqual("output_dir/file.html");
        });

        it("call put on client with the correct path", function () {
            var spy_callback = jasmine.createSpy();

            spyOn(Fs, "readFile").andCallFake(function (path, callback) {
                callback(null, new Buffer("sample"));
            });

            spyOn(S3Publisher.bucket, 'putObject').andCallFake(function (params, cb) {

                // test params.Body at the end of this spec
                cb();
            });

            S3Publisher.copyFile(
                Path.join("output_dir" , "sub" , "file.html"),
                Path.join("sub" , "file.html"),
                spy_callback
            );

            expect(S3Publisher.bucket.putObject.mostRecentCall.args[0].Body.toString('utf8')).toEqual('sample');
            expect(S3Publisher.bucket.putObject.mostRecentCall.args[0].ContentType).toEqual('text/html');
            expect(S3Publisher.bucket.putObject.mostRecentCall.args[0].Key).toEqual('sub/file.html');
        });

});
