var THREE = require("three");

function checkExample( example, subdirectory, trueName ) {

    if ( THREE[example] === undefined )
        throw `THREE is missing example '${example}' and, as such, webgl-modelers-plugin-blobtree can't work properly. You can find it` +
        ` in 'three/examples/js/${subdirectory !== undefined ? subdirectory + '/' : ''}${trueName || example}.js'`

}

checkExample('BufferGeometryUtils', 'utils');
