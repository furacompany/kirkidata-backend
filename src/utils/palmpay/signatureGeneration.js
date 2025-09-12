const md5 = require("md5");
const { KJUR, hextob64, b64tohex } = require("jsrsasign");

// Define constants for signature algorithms and PEM formatting
const HashMap = {
  SHA256withRSA: "SHA256withRSA",
  SHA1withRSA: "SHA1withRSA",
};

const PEM_BEGIN_PRIVATE = "-----BEGIN PRIVATE KEY-----\n";
const PEM_END_PRIVATE = "\n-----END PRIVATE KEY-----";
const PEM_BEGIN_PUBLIC = "-----BEGIN PUBLIC KEY-----\n";
const PEM_END_PUBLIC = "\n-----END PUBLIC KEY-----";

// Function to sign the request body using RSA-SHA1 algorithm
function sign(params, privateKey) {
  let parseStr = sortParams(params);
  console.log("📝 Sorted params string:", parseStr);

  parseStr = md5(parseStr).toUpperCase();
  console.log("🔐 MD5 hash:", parseStr);

  const str = rsaSign(parseStr, privateKey, HashMap.SHA1withRSA);
  console.log("✍️ Generated signature:", str);

  return str;
}

function sortParams(params) {
  return Object.keys(params)
    .sort()
    .filter((item) => params[item])
    .map((item) => `${item}=${params[item]}`)
    .join("&");
}

// Function to perform RSA signing using jsrsasign library
function rsaSign(content, privateKey, hash) {
  const _privateKey = formatKey(privateKey, "private");

  const signature = new KJUR.crypto.Signature({
    alg: hash,
    prvkeypem: _privateKey,
  });

  signature.updateString(content);
  const signData = signature.sign();

  return hextob64(signData);
}

// Function to verify the RSA signature using jsrsasign library
function rsaVerify(encryData, signature, publicKey, hash) {
  const _publicKey = formatKey(publicKey, "public");

  const sig = new KJUR.crypto.Signature({
    alg: hash,
  });
  sig.init(_publicKey);
  sig.updateString(encryData);
  const isVerified = sig.verify(b64tohex(signature));

  return isVerified;
}

// Function to ensure private or public key is correctly formatted with PEM header and footer
function formatKey(key, keyType) {
  if (keyType === "private") {
    if (!key.startsWith(PEM_BEGIN_PRIVATE)) {
      key = PEM_BEGIN_PRIVATE + key;
    }
    if (!key.endsWith(PEM_END_PRIVATE)) {
      key = key + PEM_END_PRIVATE;
    }
  } else {
    if (!key.startsWith(PEM_BEGIN_PUBLIC)) {
      key = PEM_BEGIN_PUBLIC + key;
    }
    if (!key.endsWith(PEM_END_PUBLIC)) {
      key = key + PEM_END_PUBLIC;
    }
  }
  return key;
}

module.exports = { sign, rsaVerify, sortParams, HashMap };
