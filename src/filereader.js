/**
 * Copyright (c) 2010 António Afonso, antonio.afonso gmail, http://www.aadsm.net/
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */
window.FileAPIReader = function(binaryData) {
    return function(url, fncCallback, fncError) {
            fncCallback(new BinaryFile(binaryData));
    }
};