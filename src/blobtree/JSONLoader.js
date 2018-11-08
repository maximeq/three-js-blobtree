'use strict';

const Element = require("./Element.js");
const Primitive = require("./Primitive.js");
const ScalisPrimitive = require("./ScalisPrimitive.js");
const ScalisPoint = require("./ScalisPoint.js");
const ScalisSegment = require("./ScalisSegment.js");
const ScalisTriangle = require("./ScalisTriangle.js");
const Node = require("./Node.js");
const RicciNode = require("./RicciNode.js");
const Root = require("./Root.js");

var JSONLoader = function() {
};

JSONLoader.prototype.constructor = JSONLoader;

JSONLoader.prototype.parse = function(json){

    switch(json.type){
        case Element.type:
            throw "JSONLoader.prototype.parse : cannot load a pure abstract Element. Must be a specialized class.";
        break;
        case Primitive.type:
            throw "JSONLoader.prototype.parse : cannot load a pure abstract Primitive. Must be a specialized class.";
        break;
        case ScalisPrimitive.type:
            throw "JSONLoader.prototype.parse : cannot load a pure abstract ScalisPrimitive. Must be a specialized class.";
        break;
        case ScalisPoint.type:
            return ScalisPoint.fromJSON(json);
        break;
        case ScalisSegment.type:
            return ScalisSegment.fromJSON(json);
        break;
        case ScalisTriangle.type:
            return ScalisTriangle.fromJSON(json);
        break;
        case Node.type:
            throw "JSONLoader.prototype.parse : cannot load a pure abstract Node. Must be a specialized class.";
        break;
        case RicciNode.type:
            var res = new RicciNode(json.ricci);
            for(var i=0; i<json.children.length; ++i){
                res.addChild(this.parse(json.children[i]));
            }
            return res;
        break;
        case Root.type:
            var res = new Root();
            for(var i=0; i<json.children.length; ++i){
                res.addChild(this.parse(json.children[i]));
            }
            return res;
        break;
        default:
            throw "JSONLoader.prototype.parse : Unkown type in json.";
        break;
    }

};

module.exports = JSONLoader;




