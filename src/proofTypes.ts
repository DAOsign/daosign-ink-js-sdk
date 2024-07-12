export interface ProofOfAuthorityVariables {
  address: string;
  sig: string;
  data: {
    domain: {
      name: string,
      version: string,
      chainId: number,
      verifyingContract: string;
    }
  };
  types: {
    ProofOfAuthority: {
      name: string,
      type: string,
    }[],
    Signer: {
      name: string,
      type: string
    }[]
  };
  primaryType: "ProofOfAuthority";
  message: {
    name: "Proof-of-Authority";
    from: string;
    agreementCID: string;
    signers: {
      addr: string,
      metadata: string
    }[],
    app: string;
    timestamp: Date;
    metadata: string;
  }

}

export interface ProofOfSignatureVariables {
  address: string;
  sig: string;
  data: {
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: string;
    };
    types: {
      ProofOfSignature: {
        name: string;
        type: string;
      }[];
    };
    primaryType: "ProofOfSignature";
    message: {
      authorityCID: string;
      name: "Proof-of-Signature";
      signer: string;
      app: string;
      timestamp: number;
      metadata: string;
    };
  };
}

export interface ProofOfAgreementVariables {
  agreementFileProofCID: string;
  agreementSignProofs: {
    proofCID: string;
  }[];
  timestamp: number;
}