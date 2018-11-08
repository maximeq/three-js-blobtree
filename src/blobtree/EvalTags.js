"use strict";

/**
 *  Eval constants : Constants for eval functions in nodes and primitives.
 *  Those are used as mask to know what is required among
 *  value, gradient and material.
 *  @enum {number}
 */
var EvalTags = {
    Value         : 1 << 1,
    Grad          : 1 << 2,
    Mat           : 1 << 3,
    NextStep      : 1 << 4,
    NextStepX     : 1 << 5,
    NextStepY     : 1 << 6,
    NextStepZ     : 1 << 7,
    NextStepOrtho : 1 << 5 | 1 << 6 | 1 << 7, // EvalTags.NextStepX | EvalTags.NextStepY | EvalTags.NextStepZ;
    ValueGrad     : 1 << 1 | 1 << 2,          // EvalTags.Value | EvalTags.Grad,
    ValueMat      : 1 << 1 | 1 << 3,          // EvalTags.Value | EvalTags.Mat,
    GradMat       : 1 << 2 | 1 << 3,          // EvalTags.Grad  | EvalTags.Mat,
    ValueGradMat  : 1 << 1 | 1 << 2 | 1 << 3  // EvalTags.Value | EvalTags.Grad | EvalTags.Mat
};

module.exports = EvalTags;
