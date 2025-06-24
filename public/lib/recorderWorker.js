// Modified Recorder.js worker file (https://github.com/mattdiamond/Recorderjs)
// Original source: https://raw.githubusercontent.com/mattdiamond/Recorderjs/08e3459624c8e384ca9478665c8f40ac9a59444b/recorderWorker.js

var recLength = 0,
  recBuffer = [],
  sampleRate;

this.onmessage = function(e){
  switch (e.data.command){
    case 'init':
      init(e.data.config);
      break;
    case 'record':
      record(e.data.buffer);
      break;
    case 'exportWAV':
      exportWAV(e.data.type);
      break;
    case 'getBuffer':
      getBuffer();
      break;
    case 'clear':
      clear();
      break;
  }
};

function init(config){
  sampleRate = config.sampleRate;
}

function record(inputBuffer){
  recBuffer.push(inputBuffer[0]);
  recLength += inputBuffer[0].length;
}

function exportWAV(type){
  var buffer = mergeBuffers(recBuffer, recLength);
  var dataview = encodeWAV(buffer);
  var audioBlob = new Blob([dataview], { type: type });

  this.postMessage({ command: 'exportWAV', data: audioBlob });
}

function getBuffer(){
  var buff = mergeBuffers(recBuffer, recLength);
  this.postMessage({ command: 'getBuffer', data: buff });
}

function clear(){
  recLength = 0;
  recBuffer = [];
}

function mergeBuffers(recBuffer, recLength){
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < recBuffer.length; i++){
    result.set(recBuffer[i], offset);
    offset += recBuffer[i].length;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples){
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type format */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}