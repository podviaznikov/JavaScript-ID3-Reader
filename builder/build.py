# JSBuilder example

# project name (from the root folder)
copyright = ''
max_js = 'dist/id3.js'
min_js = 'dist/id3.min.js'

# file list (from the root/src folder)
files = [
    "stringutils.js",
    "binaryfile.js",
    "filereader.js",
    "base64.js",
    "id3.js",
    "id3v1.js",
    "id3v2.js",
    "id3v2frames.js",
    "id4.js"
]

# execute the task
import JSBuilder
JSBuilder.compile(
    copyright,
    max_js,
    min_js,
    files
)

# let me read the result ...
import time
time.sleep(2)