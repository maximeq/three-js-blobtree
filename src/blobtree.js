var Blobtree = {};

Blobtree.Types    = require("./blobtree/Types.js");

Blobtree.Element    = require("./blobtree/Element.js");
Blobtree.Node       = require("./blobtree/Node.js");
Blobtree.RicciNode  = require("./blobtree/RicciNode.js");
Blobtree.RootNode   = require("./blobtree/RootNode.js");
Blobtree.Primitive  = require("./blobtree/Primitive.js");
Blobtree.ScalisPrimitive    = require("./blobtree/ScalisPrimitive.js");
Blobtree.ScalisPoint        = require("./blobtree/ScalisPoint.js");
Blobtree.ScalisSegment      = require("./blobtree/ScalisSegment.js");
Blobtree.ScalisTriangle     = require("./blobtree/ScalisTriangle.js");
Blobtree.Material           = require("./blobtree/Material.js");
Blobtree.ScalisVertex             = require("./blobtree/ScalisVertex.js");

Blobtree.Area = require("./blobtree/Areas/Area.js");
Blobtree.AreaScalisPoint = require("./blobtree/Areas/AreaScalisPoint.js");
Blobtree.AreaScalisSeg = require("./blobtree/Areas/AreaScalisSeg.js");
Blobtree.AreaScalisTri = require("./blobtree/Areas/AreaScalisTri.js");

Blobtree.SlidingMarchingCubes = require("./polygonizers/SlidingMarchingCubes.js");

Blobtree.JSONLoader = require("./blobtree/JSONLoader.js");

module.exports = Blobtree;
