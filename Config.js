var Config = {
DATA_DIRECTORY: "./manualData",
NEURALNET_DATA_DIRECTORY: "./neuNetData",
FILTERED_DATA_DIRECTORY: "./filteredData",
MANUAL_DATA_FILE_PREFIX: "sharan_new_",
NEURALNET_DATA_FILE_PREFIX: "sharan_new_",
FILTERED_DATA_FILE_PREFIX: "sharan_new_",
IS_COLLECTING_DATA: false, // set it to true to collect data on manual training
IS_AUTO_PLAYING: true,  // set it to true to let the dinosaur play on its own
IS_TRAINING: false, // set it to true to train the neural net from manual data
IS_FILTERING_DATA:false, // set it to true to filter manually collected data
}

module.exports = Config;
