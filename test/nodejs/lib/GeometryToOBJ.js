/**
*  @param {Object} options Option dictionnary.
*                  {boolean} vt : export vertex texture uvs
*                  {boolean} vn : export vertex normals
*                  {boolean} vc : export vertex colors
*                  {number}  min_prec : number of fixed digit to keep after 0.
*                  {number}  prec : precision, ie number of significant digit to keep.
*  @return {string}
*/
var GeometryToOBJ = function(g, options)
{
    if(options === undefined){
        options = {
            vt:true,
            vn:true,
            vc:true
        };
    }

    var positions = g.getAttribute("position");
    var normals = g.getAttribute("normal");
    var colors = g.getAttribute("color");


    var n_faces = g.getIndex() ? g.getIndex().count/3 : positions.count/3;
    var n_vertices = positions.count;

    var s ='';

    var toPrecision = function(n){
        var res = n;
        if(options.min_prec !== undefined){
            res = parseFloat(n.toFixed(options.min_prec));
        }
        if(options.prec !== undefined){
            res = parseFloat(res.toPrecision(options.prec));
        }

        return res.toString();
    };


    // console.log("-- Exporting vertices...("+n_vertices+")");
    for (var i=0; i<n_vertices; i++)
    {
        s+= 'v '+   toPrecision(positions.getX(i)) + ' ' +
        toPrecision(positions.getY(i)) + ' ' +
        toPrecision(positions.getZ(i));
        if(options.vc && colors){
            s+= ' '  + colors.getX(i).toString() +
            ' '  +  colors.getY(i).toString() +
            ' '  +  colors.getZ(i).toString()
        }
        s += '\n';
    }

    // If there are per vertex normals, use them
    // console.log("-- Exporting normals...");
    if(options.vn && g.getAttribute("normal") !== undefined){
        for (var i = 0; i <n_vertices; i++)
        {
            s+= 'vn ' + normals.getX(i).toString() +
            ' '  +  normals.getY(i).toString() +
            ' '  +  normals.getZ(i).toString() + '\n';
        }
    }else{
        // console.log(" Canceled : object is requested without normals.");
    }
    // console.log("-- Exporting texture coord...");
    if(options.vt && g.getAttribute("uv") !== undefined){
        var uvs = g.getAttribute("uv");
        for (var i = 0; i <n_vertices; i++)
        {
            s+= 'vt ' + uvs.getX(i) +
            ' '  + uvs.getY(i) + '\n';
        }
    }else{
        // console.log(" Canceled : object is requested without texture coords.");
    }

    // console.log("-- Exporting faces...");
    // Export faces
    var indices = g.getIndex();
    if(indices !== null){
        for (var i = 0; i < n_faces * 3; i+=3) {

            s+= 'f ' + (indices.array[i]  + 1) + ' ' +
            (indices.array[i+1] + 1) + ' ' +
            (indices.array[i+2] + 1);
            s+= '\n';
        }
    }else{
        // unindexed geometry. exports faces from vertices array
        for(var i=0; i<positions.count; i+=3){
            s+= 'f ' + (i+1) + ' ' +
            (i+2) + ' ' +
            (i+3);
            s+= '\n';
        }
    }

    return s;
};

module.exports = GeometryToOBJ;
