/**
 * Buffered Binary Ajax 0.2.1
 * Copyright (c) 2010 António Afonso, antonio.afonso gmail, http://www.aadsm.net/
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 * Adapted from Binary Ajax 0.1.5
 */

/**
 * @class Reads a remote file without having to download it all.
 *
 * Creates a new BufferedBinaryFile that will download chunks of the file pointed by the URL given only on a per need basis.
 *
 * @param {string} strUrl The URL with the location of the file to be read.
 * @param {number} iLength The size of the file.
 * @param {number} [blockSize=2048] The size of the chunk that will be downloaded when data is read.
 * @param {number} [blockRadius=0] The number of chunks, immediately after and before the chunk needed, that will also be downloaded.
 *
 * @constructor
 * @augments BinaryFile
 */
function BufferedBinaryFile(strUrl, iLength, blockSize, blockRadius) {
    var undefined;
    var downloadedBytesCount = 0;
    var binaryFile = new BinaryFile("", 0, iLength);
    var blocks = [];

    blockSize = blockSize || 1024*2;
    blockRadius = (typeof blockRadius === "undefined") ? 0 : blockRadius;
    blockTotal = ~~((iLength-1)/blockSize) + 1;

    function getBlockRangeForByteRange(range) {
        var blockStart = ~~(range[0]/blockSize) - blockRadius;
        var blockEnd = ~~(range[1]/blockSize)+1 + blockRadius;

        if( blockStart < 0 ) blockStart = 0;
        if( blockEnd >= blockTotal ) blockEnd = blockTotal-1;

        return [blockStart, blockEnd];
    }

    // TODO: wondering if a "recently used block" could help things around
    //       here.
    function getBlockAtOffset(offset) {
        var blockRange = getBlockRangeForByteRange([offset, offset]);
        waitForBlocks(blockRange);
        return blocks[~~(offset/blockSize)];
    }

    /**
     * @param {?function()} callback If a function is passed then this function will be asynchronous and the callback invoked when the blocks have been loaded, otherwise it blocks script execution until the request is completed.
     */
    function waitForBlocks(blockRange, callback) {
        // Filter out already downloaded blocks or return if found out that
        // the entire block range has already been downloaded.
        while( blocks[blockRange[0]] ) {
            blockRange[0]++;
            if( blockRange[0] > blockRange[1] ) return callback ? callback() : undefined;
        }
        while( blocks[blockRange[1]] ) {
            blockRange[1]--;
            if( blockRange[0] > blockRange[1] ) return callback ? callback() : undefined;
        }
        var range = [blockRange[0]*blockSize, (blockRange[1]+1)*blockSize-1];
        //console.log("Getting: " + range[0] + " to " +  range[1]);
        sendRequest(
            strUrl,
            function(http) {
                var size = parseInt(http.getResponseHeader("Content-Length"), 10);
                // Range header not supported
                if( size == iLength ) {
                    blockRange[0] = 0;
                    blockRange[1] = blockTotal-1;
                    range[0] = 0;
                    range[1] = iLength-1;
                }
                var block = {
                    data: http.responseBody || http.responseText,
                    offset: range[0]
                };

                for( var i = blockRange[0]; i <= blockRange[1]; i++ ) {
                    blocks[i] = block;
                }
                downloadedBytesCount += range[1] - range[0] + 1;
                if (callback) callback();
            },
            fncError,
            range,
            "bytes",
            undefined,
            !!callback
        );
    }

    // Mixin all BinaryFile's methods.
    // Not using prototype linking since the constructor needs to know
    // the length of the file.
    for( var key in binaryFile ) {
        if( binaryFile.hasOwnProperty(key) &&
            typeof binaryFile[key] === "function") {
            this[key] = binaryFile[key];
        }
    }
    /**
     * @override
     */
    this.getByteAt = function(iOffset) {
        var block = getBlockAtOffset(iOffset);
        if( typeof block.data == "string" ) {
            return block.data.charCodeAt(iOffset - block.offset) & 0xFF;
        } else if( typeof block.data == "unknown" ) {
            return IEBinary_getByteAt(block.data, iOffset - block.offset);
        }
    };

    /**
     * Gets the number of total bytes that have been downloaded.
     *
     * @returns The number of total bytes that have been downloaded.
     */
    this.getDownloadedBytesCount = function() {
        return downloadedBytesCount;
    };

    /**
     * Downloads the byte range given. Useful for preloading.
     *
     * @param {Array} range Two element array that denotes the first byte to be read on the first position and the last byte to be read on the last position. A range of [2, 5] will download bytes 2,3,4 and 5.
     * @param {?function()} callback The function to invoke when the blocks have been downloaded, this makes this call asynchronous.
     */
    this.loadRange = function(range, callback) {
        var blockRange = getBlockRangeForByteRange(range);
        waitForBlocks(blockRange, callback);
    };
}


/**
 * @constructor
 */
function BinaryFile(strData, iDataOffset, iDataLength) {
	var data = strData;
	var dataOffset = iDataOffset || 0;
	var dataLength = 0;

	this.getRawData = function() {
		return data;
	};

	if (typeof strData == "string") {
		dataLength = iDataLength || data.length;

		this.getByteAt = function(iOffset) {
			return data.charCodeAt(iOffset + dataOffset) & 0xFF;
		};
	} else if (typeof strData == "unknown") {
		dataLength = iDataLength || IEBinary_getLength(data);

		this.getByteAt = function(iOffset) {
			return IEBinary_getByteAt(data, iOffset + dataOffset);
		};
	}
    // @aadsm
    this.getBytesAt = function(iOffset, iLength) {
        var bytes = new Array(iLength);
        for( var i = 0; i < iLength; i++ ) {
            bytes[i] = this.getByteAt(iOffset+i);
        }
        return bytes;
    };

	this.getLength = function() {
		return dataLength;
	};

    // @aadsm
    this.isBitSetAt = function(iOffset, iBit) {
        var iByte = this.getByteAt(iOffset);
        return (iByte & (1 << iBit)) != 0;
    };

	this.getSByteAt = function(iOffset) {
		var iByte = this.getByteAt(iOffset);
		if (iByte > 127)
			return iByte - 256;
		else
			return iByte;
	};

	this.getShortAt = function(iOffset, bBigEndian) {
		var iShort = bBigEndian ?
			(this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
			: (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset);
		if (iShort < 0) iShort += 65536;
		return iShort;
	};
	this.getSShortAt = function(iOffset, bBigEndian) {
		var iUShort = this.getShortAt(iOffset, bBigEndian);
		if (iUShort > 32767)
			return iUShort - 65536;
		else
			return iUShort;
	};
	this.getLongAt = function(iOffset, bBigEndian) {
		var iByte1 = this.getByteAt(iOffset),
			iByte2 = this.getByteAt(iOffset + 1),
			iByte3 = this.getByteAt(iOffset + 2),
			iByte4 = this.getByteAt(iOffset + 3);

		var iLong = bBigEndian ?
			(((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
			: (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
		if (iLong < 0) iLong += 4294967296;
		return iLong;
	};
	this.getSLongAt = function(iOffset, bBigEndian) {
		var iULong = this.getLongAt(iOffset, bBigEndian);
		if (iULong > 2147483647)
			return iULong - 4294967296;
		else
			return iULong;
	};
	// @aadsm
	this.getInteger24At = function(iOffset, bBigEndian) {
        var iByte1 = this.getByteAt(iOffset),
			iByte2 = this.getByteAt(iOffset + 1),
			iByte3 = this.getByteAt(iOffset + 2);

		var iInteger = bBigEndian ?
			((((iByte1 << 8) + iByte2) << 8) + iByte3)
			: ((((iByte3 << 8) + iByte2) << 8) + iByte1);
		if (iInteger < 0) iInteger += 16777216;
		return iInteger;
    };
	this.getStringAt = function(iOffset, iLength) {
		var aStr = [];
		for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
			aStr[j] = String.fromCharCode(this.getByteAt(i));
		}
		return aStr.join("");
	};
	// @aadsm
	this.getStringWithCharsetAt = function(iOffset, iLength, iCharset) {
		if(!(iOffset>0) || !(iLength>0)){
		    return '';
		}
		var bytes = this.getBytesAt(iOffset, iLength),
		    originalString = this.getStringAt(iOffset, iLength),
		    iCharset=iCharset || jschardet.detect(originalString).encoding,
		    sString;
        console.log('Charset:',iCharset);

		switch( iCharset.toLowerCase() ) {

		    case 'utf-16':
		    case 'utf-16le':
		    case 'utf-16be':
		        sString = StringUtils.readUTF16String(bytes, iCharset);
		        break;

		    case 'utf-8':
		        sString = StringUtils.readUTF8String(bytes);
		        break;
            case 'iso-8859-1':
                var charsetDetection=jschardet.detect(originalString);
                console.log('Detection:',charsetDetection);
                if('TIS-620'===charsetDetection.encoding ||
                'windows-1253'===charsetDetection.encoding ||
                'windows-1251'===charsetDetection.encoding ||
                'EUC-TV'===charsetDetection.encoding){
                    sString = StringUtils.readWin1251String(originalString);
                    break;
                }
            case 'windows-1251':
                sString = StringUtils.readWin1251String(originalString);
                break;
            case 'maccyrillic':
                sString = StringUtils.readWin1251String(originalString);
                break;
		    default:
		        sString = StringUtils.readNullTerminatedString(bytes);
		        break;
		}
        console.log('Result',sString);
		return sString;
	};

	this.getCharAt = function(iOffset) {
		return String.fromCharCode(this.getByteAt(iOffset));
	};
	this.toBase64 = function() {
		return window.btoa(data);
	};
	this.fromBase64 = function(strBase64) {
		data = window.atob(strBase64);
	};

    this.loadRange = function(range, callback) {
        callback();
    };
}