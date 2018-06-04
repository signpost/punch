var fs = require('fs');

module.exports = {

    setup: function(config) {
        this.activeTemplatePath = config.activeTemplatePath;
        this.templateTagName = config.templateTagName;
    },

    get: function(basepath, content_type, request_options, callback) {
        var self = this;

        return callback(
            null,
            {
                tag: {
                    [self.templateTagName]: self.loadActiveTemplateFromIndex()
                },
                block: {}
            },
            {},
            {}
        );
    },

    loadActiveTemplateFromIndex: function() {
        if(!this.activeTemplatePath) {
            return '';
        }

        try {
            var allTemplates = JSON.parse(fs.readFileSync(__dirname + this.activeTemplatePath  + 'index.json', 'utf8'));
            var activeTemplate = allTemplates.find(template => template.isActive);

            if (!activeTemplate || !activeTemplate.fullMarkupFile) {
                console.log('Error -- active template not found');
                return '';
            }

            return fs.readFileSync(__dirname + this.activeTemplatePath + activeTemplate.fullMarkupFile, 'utf8');
        } catch (e) {
            console.log(e);
        }

        return '';
	}
};
