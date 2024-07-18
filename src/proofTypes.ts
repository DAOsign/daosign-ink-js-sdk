export interface ProofOfAuthorityVariables {
  proofCID: string;
  signature: string;
  message: {
    name: string;
    from: string;
    agreementCID: string;
    signers: Array<{
      addr: string,
      metadata: string
    }>,
    timestamp: number;
    metadata: string;
  }
}

export interface ProofOfSignatureVariables {
  proofCID: string;
  signature: string;
  message: {
      authorityCID: string;
      name: string;
      signer: string;
      timestamp: number;
      metadata: string;
  };
}

export interface ProofOfAgreementVariables {
  message: {
    name: string;
    authorityCID: string;
    signatureCIDs: string[];
    timestamp: number;
    metadata: string;
  };
  proofCID: string;
}