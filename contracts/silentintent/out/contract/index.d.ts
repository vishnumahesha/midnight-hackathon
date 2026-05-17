import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  maxPriceCents(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  requiredCredentialHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  forbiddenTermHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  intentSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  offerPriceCents(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  offerCredentialHashes(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array[]];
  offerDetectedForbiddenHashes(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array[]];
  offerSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  offerPriceBand(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, string];
}

export type ImpureCircuits<PS> = {
  registerIntent(context: __compactRuntime.CircuitContext<PS>,
                 newPolicyId_0: string): __compactRuntime.CircuitResults<PS, []>;
  evaluateOffer(context: __compactRuntime.CircuitContext<PS>,
                newDealId_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerIntent(context: __compactRuntime.CircuitContext<PS>,
                 newPolicyId_0: string): __compactRuntime.CircuitResults<PS, []>;
  evaluateOffer(context: __compactRuntime.CircuitContext<PS>,
                newDealId_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerIntent(context: __compactRuntime.CircuitContext<PS>,
                 newPolicyId_0: string): __compactRuntime.CircuitResults<PS, []>;
  evaluateOffer(context: __compactRuntime.CircuitContext<PS>,
                newDealId_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly dealId: string;
  readonly policyId: string;
  readonly settlementAuthorized: boolean;
  readonly priceBand: string;
  readonly intentCommitment: Uint8Array;
  readonly offerCommitment: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
