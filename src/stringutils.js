/**
 * Copyright (c) 2010, António Afonso <antonio.afonso gmail.com>. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 * 
 *    1. Redistributions of source code must retain the above copyright notice, this list of
 *       conditions and the following disclaimer.
 * 
 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
 *       of conditions and the following disclaimer in the documentation and/or other materials
 *       provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY António Afonso ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var StringUtils = {
    readUTF16String: function(bytes, bigEndian, maxBytes) {
        var ix = 0;
        var offset1 = 1, offset2 = 0;
        maxBytes = Math.min(maxBytes||bytes.length, bytes.length);

        if( bytes[0] == 0xFE && bytes[1] == 0xFF ) {
            bigEndian = true;
            ix = 2;
        } else if( bytes[0] == 0xFF && bytes[1] == 0xFE ) {
            bigEndian = false;
            ix = 2;
        }
        if( bigEndian ) {
            offset1 = 0;
            offset2 = 1;
        }

        var arr = [];
        for( var j = 0; ix < maxBytes; j++ ) {
            var byte1 = bytes[ix+offset1];
            var byte2 = bytes[ix+offset2];
            var word1 = (byte1<<8)+byte2;
            ix += 2;
            if( word1 == 0x0000 ) {
                break;
            } else if( byte1 < 0xD8 || byte1 >= 0xE0 ) {
                arr[j] = String.fromCharCode(word1);
            } else {
                var byte3 = bytes[ix+offset1];
                var byte4 = bytes[ix+offset2];
                var word2 = (byte3<<8)+byte4;
                ix += 2;
                arr[j] = String.fromCharCode(word1, word2);
            }
        }
        var string = new String(arr.join(""));
        string.bytesReadCount = ix;
        return string;
    },
    readUTF8String: function(bytes, maxBytes) {
        var ix = 0;
        maxBytes = Math.min(maxBytes||bytes.length, bytes.length);

        if( bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF ) {
            ix = 3;
        }

        var arr = [];
        for( var j = 0; ix < maxBytes; j++ ) {
            var byte1 = bytes[ix++];
            if( byte1 == 0x00 ) {
                break;
            } else if( byte1 < 0x80 ) {
                arr[j] = String.fromCharCode(byte1);
            } else if( byte1 >= 0xC2 && byte1 < 0xE0 ) {
                var byte2 = bytes[ix++];
                arr[j] = String.fromCharCode(((byte1&0x1F)<<6) + (byte2&0x3F));
            } else if( byte1 >= 0xE0 && byte1 < 0xF0 ) {
                var byte2 = bytes[ix++];
                var byte3 = bytes[ix++];
                arr[j] = String.fromCharCode(((byte1&0xFF)<<12) + ((byte2&0x3F)<<6) + (byte3&0x3F));
            } else if( byte1 >= 0xF0 && byte1 < 0xF5) {
                var byte2 = bytes[ix++];
                var byte3 = bytes[ix++];
                var byte4 = bytes[ix++];
                var codepoint = ((byte1&0x07)<<18) + ((byte2&0x3F)<<12)+ ((byte3&0x3F)<<6) + (byte4&0x3F) - 0x10000;
                arr[j] = String.fromCharCode(
                    (codepoint>>10) + 0xD800,
                    (codepoint&0x3FF) + 0xDC00
                );
            }
        }
        var string = new String(arr.join(""));
        string.bytesReadCount = ix;
        return string;
    },
    readNullTerminatedString: function(bytes, maxBytes) {
        var arr = [];
        maxBytes = maxBytes || bytes.length;
        for ( var i = 0; i < maxBytes; ) {
            var byte1 = bytes[i++];
            if( byte1 == 0x00 ) break;
		    arr[i-1] = String.fromCharCode(byte1);
	    }	    
        var string = new String(arr.join(""));
        string.bytesReadCount = i;
        return string;
    },

   readWin1251String: function(str) {
       var charmap   = unescape(
          "%u0402%u0403%u201A%u0453%u201E%u2026%u2020%u2021%u20AC%u2030%u0409%u2039%u040A%u040C%u040B%u040F"+
          "%u0452%u2018%u2019%u201C%u201D%u2022%u2013%u2014%u0000%u2122%u0459%u203A%u045A%u045C%u045B%u045F"+
          "%u00A0%u040E%u045E%u0408%u00A4%u0490%u00A6%u00A7%u0401%u00A9%u0404%u00AB%u00AC%u00AD%u00AE%u0407"+
          "%u00B0%u00B1%u0406%u0456%u0491%u00B5%u00B6%u00B7%u0451%u2116%u0454%u00BB%u0458%u0405%u0455%u0457")
       var code2char = function(code) {
                   if(code >= 0xC0 && code <= 0xFF) return String.fromCharCode(code - 0xC0 + 0x0410)
                   if(code >= 0x80 && code <= 0xBF) return charmap.charAt(code - 0x80)
                   return String.fromCharCode(code)
                }
       var res = ""
       for(var i = 0; i < str.length; i++) res = res + code2char(str.charCodeAt(i))
       console.log('Win1251 result:',res);
       return res
    }
};