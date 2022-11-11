#!/bin/sh

if [ "$#" -ne 1 ]
then
  echo "Usage: Must supply a domain"
  exit 1
fi

DOMAIN=$1

mkdir ./certs
cd ./certs

openssl genrsa -out domain.key 2048
openssl req -new -key domain.key -out domain.csr
openssl req -x509 -new -nodes -key domain.key -sha256 -days 1825 -out domain.pem

cat > domain.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = *.*.$DOMAIN
DNS.2 = *.$DOMAIN
DNS.3 = $DOMAIN
EOF

openssl x509 -req -in domain.csr -CA ./domain.pem -CAkey ./domain.key -CAcreateserial \
-out domain.crt -days 1825 -sha256 -extfile domain.ext