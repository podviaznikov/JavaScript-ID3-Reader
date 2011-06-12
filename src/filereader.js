/**
 * Copyright (c) 2011 Anton Podviaznikov, podviaznikov@gmail.com
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */
 (function(ns) {
    ns["FileAPIReader"] = function(binaryData) {
        return function(url, fncCallback, fncError) {
                fncCallback(new BinaryFile(binaryData));
        }
    };
})(this);
