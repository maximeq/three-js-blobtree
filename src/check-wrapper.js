import { checkDependancy, checkThreeRevision } from "three-js-checker";
import * as Blobtree from "./export";
import {BufferGeometryUtils} from "three/examples/jsm/utils/BufferGeometryUtils";

const PACKAGE_NAME = "three-js-blobtree";

checkThreeRevision(PACKAGE_NAME, 130);
checkDependancy(PACKAGE_NAME, "BufferGeometryUtils", BufferGeometryUtils);
checkDependancy(PACKAGE_NAME, "Blobtree", Blobtree);

export * from "./export";
