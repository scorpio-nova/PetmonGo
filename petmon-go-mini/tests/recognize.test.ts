import { getRecognitionErrorMessage, normalizeMediaPath } from '../src/utils/recognize'

if (normalizeMediaPath({ tempFilePaths: ['/tmp/pet.jpg'] }) !== '/tmp/pet.jpg') {
  throw new Error('recognition should normalize chooseMedia tempFilePaths')
}

if (normalizeMediaPath({ tempFiles: [{ tempFilePath: '/tmp/pet-legacy.jpg' }] }) !== '/tmp/pet-legacy.jpg') {
  throw new Error('recognition should support legacy chooseImage tempFiles')
}

if (!getRecognitionErrorMessage({ errMsg: 'chooseMedia:fail cancel' }).includes('已取消')) {
  throw new Error('cancelled media selection should have a friendly message')
}

if (!getRecognitionErrorMessage({ errMsg: 'chooseMedia:fail auth deny' }).includes('相机')) {
  throw new Error('denied media permission should explain camera permission')
}

console.log('recognition utility checks passed')
