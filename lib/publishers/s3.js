var _ = require("underscore");
var AWS = require('aws-sdk');
var Mime = require("mime");
var Fs = require("fs");
var Path = require("path");

var DeepFstream = require("../utils/deep_fstream");

module.exports = {

	client: null,

	lastPublishedDate: null,

	publishOptions: null,

	retrieveOptions: function(supplied_config) {
		var self = this;
		var error = "Cannot find s3 settings in config";

		if (_.has(supplied_config, "publish") && _.has(supplied_config["publish"], "options")) {
			return supplied_config["publish"]["options"];
		} else {
			throw error;
		}
	},

	isModified: function(modified_date) {
		var self = this;

		return ( modified_date > self.lastPublishedDate	);
	},

	copyFile: function(local_path, remote_path, callback) {
		var self = this;

		Fs.readFile(local_path, function(error, buf) {
			if (error) {
				throw error;
			}

			remote_path = remote_path.replace(/\\/g, "/");

		        self.bucket.putObject({ Key: remote_path, Body: buf, ContentType: Mime.lookup(local_path) }, function (err, data) {
                            if (err) {
				console.log("error occured in copying to %s", remote_path);
				throw err;
                            }
                            console.log("saved to %s", remote_path);
                            callback();
			});
		});
	},

	fetchAndCopyFiles: function(supplied_config, complete) {
		var self = this;
		var output_dir = (supplied_config && supplied_config.output_dir) || "";
		var output_dir_path = Path.join(process.cwd(), output_dir);
		var file_stream = new DeepFstream(output_dir_path);

		file_stream.on("directory", function(entry, callback) {
			return callback();
		});

		file_stream.on("file", function(entry, callback) {
			if (self.isModified(entry.props.mtime)) {
				var relative_path = Path.relative(output_dir_path, entry.path);
				return self.copyFile(entry.path, relative_path, callback);
			} else {
				return callback();
			}
		});

		file_stream.on("end", function() {
			return complete();
		});
	},

	publish: function(supplied_config, last_published_date, callback) {
		var self = this;

		self.publishOptions = self.retrieveOptions(supplied_config);

	        self.bucket = new AWS.S3({ params: { Bucket: self.publishOptions.bucket } });

		self.lastPublishedDate = last_published_date;

		return self.fetchAndCopyFiles(supplied_config, callback);
	}

};
