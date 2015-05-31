module.exports = {
    invertObject: function (obj) {
        var invObj = {};
        var value;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                value = obj[key];
                invObj[value] = key;
            }
        }
        return invObj;
    }
};