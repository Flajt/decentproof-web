const validHash = document.getElementById("valid-hash");
const locationEmbedded = document.getElementById("location-embedded")
const signatureValid = document.getElementById("valid-sig")
const fileSelector = document.getElementById('file-upload');
const mcaptchaToken = document.getElementById("mcaptcha__token")
const submission = document.getElementById("submission")
const iframe = document.getElementById("mcaptcha-widget__iframe")
let publicKey;

fileSelector.addEventListener("change", (event) => {
    document.getElementsByClassName("file-upload-label")[0].innerHTML = event.target.files[0].name
})
submission.addEventListener('click', async (event) => {
    let token = mcaptchaToken.value
    if (token == null || token == "") {
        alert("Please activate the Captcha!")
        return
    }
    const fileList = fileSelector.files;
    if (fileList[0]) {
        const file = fileList[0]
        const fileSize = file.size;
        const fileData = await readBinaryFile(file)
        const byteArray = new Uint8Array(fileData);
        const bytes = await hashFile(byteArray)
        try {
            const resp = await callApi(toHex(bytes), token)
            validHash.innerHTML = "\u2713"
            if (file.name.includes(".png")) {
                await extractPNGMetadata(file)
            }else{
            const mediainfo = await MediaInfo({ format: 'object',full: true }, async (mediaInfo) => { // Taken from docs
                mediaInfo.analyzeData(() => fileSize, (chunkSize, offset) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                            if (event.target.error) {
                                reject(event.target.error)
                            }
                            resolve(new Uint8Array(event.target.result))
                        }
                        reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
                    })
                }).then((mediaInfo)=>{
                    try {
                        const tags = mediaInfo.media.track[0].extra
                        latitude = tags.latitude
                        longitude = tags.longitude
                        if (latitude==null || longitude == null) {
                            latitude = tags.LATITUDE
                            longitude = tags.LONGITUDE
                        }
                        if (latitude && longitude) {
                            locationEmbedded.innerHTML = "\u2713"
                        } else {
                            locationEmbedded.innerHTML = "\u2717"
                        }
                    } catch (e) {
                        locationEmbedded.innerHTML = "\u2717"
                    }

            })})
        }
            if (publicKey == undefined) {
                let req = await fetch("/publickey")
                if (req.ok) {
                    publicKey = await req.text()
                } else {
                    throw "Could not get public key"
                }
            }

            let signature = resp.data.comment
            if (signature == null || signature == "") {
                throw "No signature found"
            }
            //const timeStamps = resp.data.timestamps
            const hashString = resp.data.hash_string
            if (hashString !== toHex(bytes)) {
                validHash.innerHTML = "\u2717"
            } else {
                validHash.innerHTML = "\u2713"
            }
            const result = await validateSignature(publicKey, signature, hashString)
            if (result) {
                signatureValid.innerHTML = "\u2713"
            } else {
                signatureValid.innerHTML = "\u2717"
            }
            mcaptchaToken.value = ""
            iframe.src = iframe.src
        } catch (e) {
            alert("Error: " + e)
            window.location.reload()
        }

    } else {
        alert("No file selected");
    }
});

async function extractPNGMetadata(file) {
    try{
    const {latitude, longitude} = await exifr.gps(file)
    if (latitude && longitude) {
        locationEmbedded.innerHTML = "\u2713"
    } else {
        locationEmbedded.innerHTML = "\u2717"

    }
    }catch(e){
        locationEmbedded.innerHTML = "\u2717"
    }
}

function toHex(buffer) {
    return Array.prototype.map.call(buffer, x => ('00' + x.toString(16)).slice(-2)).join('');
}

async function callApi(hash, token) {
    const url = "/verify";
    let resp = await fetch(url, {
        headers: { "X-MCAPTCHA-TOKEN": token },
        method: "POST",
        body: JSON.stringify({ hash: hash })
    })
    if (resp.ok) {
        return await resp.json();
    } else {
        if (resp.status == 401) {
            throw resp.status
        } else {
            throw "Your hash is either invalid or has not been submitted via the Decentproof App!"
        }
    }
}

async function hashFile(byteArray) {
    let hashBytes = await window.crypto.subtle.digest('SHA-256', byteArray);
    return new Uint8Array(hashBytes)
}

async function validateSignature(key, signature, hash) {
    const importedKey = importPublicKey(key)
    const result = importedKey.verifyWithMessageHash(hash, signature)
    return result

}

function readBinaryFile(file) {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = () => {
            resolve(fr.result)
        };
        fr.readAsArrayBuffer(file);
    });
}
function importPublicKey(pem) {
    return KEYUTIL.getKey(pem);
}
