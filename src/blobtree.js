
const THREE = require("three-full/builds/Three.cjs.js");
if(THREE.REVISION !== "96"){
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
Blobtree.MaxNode            = require("./blobtree/MinNode.js");

Blobtree.Primitive          = require("./blobtree/Primitive.js");

Blobtree.ScalisMath         = require("./blobtree/scalis/ScalisMath.js");
Blobtree.ScalisPrimitive    = require("./blobtree/scalis/ScalisPrimitive.js");
Blobtree.ScalisPoint        = require("./blobtree/scalis/ScalisPoint.js");
Blobtree.ScalisSegment      = require("./blobtree/scalis/ScalisSegment.js");
Blobtree.ScalisTriangle     = require("./blobtree/scalis/ScalisTriangle.js");
Blobtree.ScalisVertex       = require("./blobtree/scalis/ScalisVertex.js");

Blobtree.DistanceFunctor    = require("./blobtree/sdf/DistanceFunctor.js");
Blobtree.Poly6DistanceFunctor = require("./blobtree/sdf/Poly6DistanceFunctor.js");

Blobtree.SDFRootNode        = require("./blobtree/sdf/SDFRootNode.js");
Blobtree.SDFPrimitive       = require("./blobtree/sdf/SDFPrimitive.js");
Blobtree.SDFPoint           = require("./blobtree/sdf/SDFPoint.js");
Blobtree.SDFSegment         = require("./blobtree/sdf/SDFSegment.js");
Blobtree.SDFSphere          = require("./blobtree/sdf/SDFSphere.js");
Blobtree.SDFCapsule         = require("./blobtree/sdf/SDFCapsule.js");

Blobtree.Material           = require("./blobtree/Material.js");

Blobtree.Accuracies         = require("./blobtree/accuracies/Accuracies.js");

Blobtree.Area               = require("./blobtree/areas/Area.js");
Blobtree.AreaScalisSeg      = require("./blobtree/areas/AreaScalisSeg.js");
Blobtree.AreaScalisTri      = require("./blobtree/areas/AreaScalisTri.js");
Blobtree.AreaSphere         = require("./blobtree/areas/AreaSphere.js");
Blobtree.AreaCapsule        = require("./blobtree/areas/AreaCapsule.js");

Blobtree.SlidingMarchingCubes = require("./polygonizers/SlidingMarchingCubes.js");
Blobtree.SplitMaxPolygonizer = require("./polygonizers/SplitMaxPolygonizer.js");
Blobtree.SplitSMC = require("./polygonizers/SplitSMC.js");

/*
try {
    if( window ) {
        window.Blobtree = Blobtree;
    }
}
catch(e) {}
*/

module.exports = Blobtree;
