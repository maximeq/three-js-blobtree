
const THREE = require("three-full/builds/Three.cjs.js");
if(THREE.REVISION !== 96){
    console.warn("Blobtree library is currently made for THREE revision 96. Using any other revision may lead to unexpected behavior.")
}

var Blobtree = {};
Blobtree.version = "1.0.0";

Blobtree.Types              = require("./blobtree/Types.js");

Blobtree.Element            = require("./blobtree/Element.js");
Blobtree.Node               = require("./blobtree/Node.js");
Blobtree.RootNode           = require("./blobtree/RootNode.js");

Blobtree.RicciNode          = require("./blobtree/RicciNode.js");
Blobtree.DifferenceNode     = require("./blobtree/DifferenceNode.js");
Blobtree.MinNode            = require("./blobtree/MinNode.js");

Blobtree.Primitive          = require("./blobtree/Primitive.js");

Blobtree.ScalisPrimitive    = require("./blobtree/ScalisPrimitive.js");
Blobtree.ScalisPoint        = require("./blobtree/ScalisPoint.js");
Blobtree.ScalisSegment      = require("./blobtree/ScalisSegment.js");
Blobtree.ScalisTriangle     = require("./blobtree/ScalisTriangle.js");
Blobtree.ScalisVertex       = require("./blobtree/ScalisVertex.js");

Blobtree.DistanceFunctor   = require("./blobtree/SDF/DistanceFunctor.js");
Blobtree.Poly6DistanceFunctor = require("./blobtree/SDF/Poly6DistanceFunctor.js");

Blobtree.SDFRootNode       = require("./blobtree/SDF/SDFRootNode.js");
Blobtree.SDFPrimitive      = require("./blobtree/SDF/SDFPrimitive.js");
Blobtree.SDFSphere         = require("./blobtree/SDF/SDFSphere.js");
Blobtree.SDFCapsule         = require("./blobtree/SDF/SDFCapsule.js");

Blobtree.ScalisPrimitive    = require("./blobtree/ScalisPrimitive.js");

Blobtree.Material           = require("./blobtree/Material.js");

Blobtree.Accuracies               = require("./blobtree/accuracies/Accuracies.js");

Blobtree.Area               = require("./blobtree/Areas/Area.js");
Blobtree.AreaScalisPoint    = require("./blobtree/Areas/AreaScalisPoint.js");
Blobtree.AreaScalisSeg      = require("./blobtree/Areas/AreaScalisSeg.js");
Blobtree.AreaScalisTri      = require("./blobtree/Areas/AreaScalisTri.js");
Blobtree.AreaSphere         = require("./blobtree/Areas/AreaSphere.js");
Blobtree.AreaCapsule        = require("./blobtree/Areas/AreaCapsule.js");

Blobtree.EvalTags           = require("./blobtree/EvalTags.js");

Blobtree.SlidingMarchingCubes = require("./polygonizers/SlidingMarchingCubes.js");

// Deprecated
Blobtree.JSONLoader         = require("./blobtree/JSONLoader.js");

/*
try {
    if( window ) {
        window.Blobtree = Blobtree;
    }
}
catch(e) {}
*/

module.exports = Blobtree;
