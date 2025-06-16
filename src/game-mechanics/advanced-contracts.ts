import { GenreId, MoodId, EntityId, ProjectId } from './common.types';
import { MarketTrend } from './market-trends'; // To assess genre popularity
import { RecordLabel, Client } from './relationship-management'; // For relationship scores

export enum ContractType {
  STANDARD_TRACK = 'StandardTrack', // Produce a single track
  ALBUM_PRODUCTION = 'AlbumProduction', // Produce a full album
  SOUNDTRACK_GIG = 'SoundtrackGig', // For a movie, game, or ad
  JINGLE_CREATION = 'JingleCreation',
  REMIX_PROJECT = 'RemixProject',
  GHOST_PRODUCTION = 'GhostProduction', // Produce for another artist, uncredited or credited
}

export enum ContractNegotiationPoint {
  DEADLINE = 'Deadline', // In game days
  BUDGET = 'Budget', // Total payment
  ROYALTY_PERCENTAGE = 'RoyaltyPercentage', // For original works or albums
  CREATIVE_FREEDOM = 'CreativeFreedom', // 0-100, lower means more client constraints
  UPFRONT_PAYMENT_PERCENTAGE = 'UpfrontPaymentPercentage',
  FEATURED_ARTIST_QUALITY = 'FeaturedArtistQuality', // If contract requires a featured artist
}

export interface ContractNegotiationOffer {
  point: ContractNegotiationPoint;
  playerValue: number;
  clientValue: number;
  playerMin?: number; // Player's absolute minimum acceptable value
  playerMax?: number; // Player's absolute maximum acceptable value
  clientMin?: number; // Client's hidden minimum
  clientMax?: number; // Client's hidden maximum
  locked?: boolean; // If this point is non-negotiable by client
}

export interface AdvancedContract {
  id: ProjectId;
  title: string;
  type: ContractType;
  offeredBy: EntityId; // Client or RecordLabel ID
  description: string;
  genre: GenreId;
  subGenre?: SubGenreId;
  moods?: MoodId[];
  
  // Core negotiable terms
  negotiationPoints: ContractNegotiationOffer[];
  
  // Requirements & Penalties
  minQuality?: number; // 0-100, if applicable
  latePenaltyPerDay?: number; // Amount deducted for each day late
  bonusForEarlyCompletion?: number; // Bonus if finished X days early
  
  // Dynamic elements based on game state
  initialOfferDate: number; // Game time when offered
  expirationDate: number; // Game time when offer expires
  prestigeScore: number; // How much this contract boosts studio reputation
  isHidden?: boolean; // For special contracts unlocked via relationships/events

  // Post-acceptance state
  isAccepted?: boolean;
  acceptedTerms?: ContractNegotiationOffer[]; // Final agreed terms
  playerCounterOfferCount?: number;
}

/**
 * AdvancedContractService: Handles generation, negotiation, and management of advanced contracts.
 */
export class AdvancedContractService {
  private availableContracts: Map<ProjectId, AdvancedContract> = new Map();
  // Dependencies (would be injected or accessed via a service locator)
  // private marketService: MarketService;
  // private relationshipService: RelationshipService;

  constructor(/* marketService: MarketService, relationshipService: RelationshipService */) {
    // this.marketService = marketService;
    // this.relationshipService = relationshipService;
  }

  /**
   * Generates a pool of new advanced contracts.
   * This would be called periodically or triggered by game events.
   * @param clients - Available clients to offer contracts.
   * @param labels - Available record labels to offer contracts.
   * @param currentMarketTrends - To influence genre/subgenre demand.
   * @param gameTime - Current game time.
   */
  generateNewContracts(
    clients: Client[], 
    labels: RecordLabel[],
    currentMarketTrends: MarketTrend[],
    gameTime: number
  ): AdvancedContract[] {
    const newContracts: AdvancedContract[] = [];
    const potentialIssuers: Array<Client | RecordLabel> = [...clients, ...labels];

    potentialIssuers.forEach(issuer => {
      // Skip blacklisted entities
      // if (this.relationshipService.isEntityBlacklisted(issuer.id)) return;
      
      // Determine if this issuer offers a contract now (based on relationship, time since last, etc.)
      // const relationshipScore = this.relationshipService.getRelationshipScore(issuer.id) || 0;
      // if (Math.random() > 0.1 + relationshipScore / 200) return; // Higher relationship = higher chance

      const contract = this.createRandomContract(issuer, currentMarketTrends, gameTime);
      if (contract) {
        newContracts.push(contract);
        this.availableContracts.set(contract.id, contract);
      }
    });
    return newContracts;
  }
  
  private createRandomContract(
    issuer: Client | RecordLabel,
    marketTrends: MarketTrend[],
    gameTime: number
  ): AdvancedContract | null {
    const id = `contract_${gameTime}_${Math.random().toString(36).substring(2,9)}`;
    const typeValues = Object.values(ContractType);
    const type = typeValues[Math.floor(Math.random() * typeValues.length)];
    
    // Select a genre, potentially influenced by issuer preference and market trends
    const preferredGenre = issuer.preferredGenres[Math.floor(Math.random() * issuer.preferredGenres.length)] || 'Pop';
    // const marketPopularity = this.marketService.getPopularity(preferredGenre);
    
    const budgetBase = (Math.random() * 50000) + 10000; // Base budget
    // const budget = budgetBase * (1 + (marketPopularity / 200)); // Market influence
    const budget = budgetBase; // Simplified for now

    const deadlineBase = Math.floor(Math.random() * 60) + 30; // 30-90 days

    const negotiationPoints: ContractNegotiationOffer[] = [
      { point: ContractNegotiationPoint.BUDGET, playerValue: budget * 0.9, clientValue: budget, clientMin: budget * 0.8, clientMax: budget * 1.2 },
      { point: ContractNegotiationPoint.DEADLINE, playerValue: deadlineBase + 10, clientValue: deadlineBase, clientMin: deadlineBase - 10, clientMax: deadlineBase + 20 },
      { point: ContractNegotiationPoint.CREATIVE_FREEDOM, playerValue: 60, clientValue: 50, clientMin: 30, clientMax: 70, locked: Math.random() < 0.2 },
    ];

    if (type === ContractType.ALBUM_PRODUCTION || type === ContractType.GHOST_PRODUCTION) {
        negotiationPoints.push({ point: ContractNegotiationPoint.ROYALTY_PERCENTAGE, playerValue: 5, clientValue: 3, clientMin: 1, clientMax: 8 });
        negotiationPoints.push({ point: ContractNegotiationPoint.UPFRONT_PAYMENT_PERCENTAGE, playerValue: 40, clientValue: 30, clientMin: 20, clientMax: 50 });
    }
    
    return {
      id,
      title: `${type} for ${issuer.name}`,
      type,
      offeredBy: issuer.id,
      description: `A ${type} project. ${issuer.name} is looking for a studio to handle this.`,
      genre: preferredGenre,
      negotiationPoints,
      initialOfferDate: gameTime,
      expirationDate: gameTime + (14 + Math.floor(Math.random()*14)), // Expires in 2-4 weeks
      prestigeScore: Math.floor(Math.random() * 50) + 10, // 10-60 prestige
      minQuality: Math.floor(Math.random() * 30) + 50, // 50-80 min quality
      latePenaltyPerDay: budget * 0.005, // 0.5% of budget per day
    };
  }

  /**
   * Player attempts to negotiate a contract.
   * @param contractId - The ID of the contract.
   * @param playerOffers - The player's proposed values for negotiable points.
   * @returns The client's counter-offer or acceptance/rejection.
   */
  negotiateContract(
    contractId: ProjectId,
    playerOffers: Array<{ point: ContractNegotiationPoint; value: number }>
  ): { status: 'accepted' | 'rejected' | 'counter_offer'; newTerms?: ContractNegotiationOffer[]; message?: string } {
    const contract = this.availableContracts.get(contractId);
    if (!contract || contract.isAccepted) return { status: 'rejected', message: 'Contract not found or already accepted.' };

    contract.playerCounterOfferCount = (contract.playerCounterOfferCount || 0) + 1;
    if (contract.playerCounterOfferCount > 3) { // Max 3 rounds of negotiation
        this.availableContracts.delete(contractId); // Or mark as permanently rejected
        return { status: 'rejected', message: 'Negotiation failed after too many attempts.' };
    }

    const newTerms: ContractNegotiationOffer[] = JSON.parse(JSON.stringify(contract.negotiationPoints));
    let clientAcceptsAll = true;

    for (const offer of playerOffers) {
      const term = newTerms.find(t => t.point === offer.point);
      if (term && !term.locked) {
        term.playerValue = offer.value; // Record player's offer

        // Simplified client logic:
        // Client has a hidden min/max. They try to meet player halfway or stick to their limits.
        if (offer.value < term.clientMin!) { // Player wants too little (e.g. for budget) or too much (e.g. for deadline)
            term.clientValue = term.clientMin!;
            clientAcceptsAll = false;
        } else if (offer.value > term.clientMax!) {
            term.clientValue = term.clientMax!;
            clientAcceptsAll = false;
        } else {
            // If within client's acceptable range, client might concede a bit
            // Example: Client moves 25% towards player's offer from their previous stance
            const previousClientValue = contract.negotiationPoints.find(t => t.point === offer.point)!.clientValue;
            term.clientValue = previousClientValue + (offer.value - previousClientValue) * 0.25;
        }
      }
    }
    
    contract.negotiationPoints = newTerms; // Update contract with latest player offer and client stance

    if (clientAcceptsAll && newTerms.every(term => term.playerValue === term.clientValue || (term.locked && term.playerValue === term.clientValue) )) { // A bit simplified check
      contract.isAccepted = true;
      contract.acceptedTerms = newTerms;
      return { status: 'accepted', newTerms };
    } else {
      // Check if client's new stance matches player's offer on all points
      const allMatched = newTerms.every(term => {
        if (term.locked) return term.playerValue === term.clientValue; // Must match if locked
        // For non-locked, check if player's offer is now acceptable to client based on client's new value
        // This logic needs refinement: clientValue is now the client's new offer.
        // If playerValue is "better" for the client than clientValue, it's fine.
        // e.g. player offers higher budget than clientValue, or shorter deadline.
        switch(term.point) {
            case ContractNegotiationPoint.BUDGET:
            case ContractNegotiationPoint.ROYALTY_PERCENTAGE:
            case ContractNegotiationPoint.UPFRONT_PAYMENT_PERCENTAGE:
                return term.playerValue <= term.clientValue; // Player wants less or equal to what client offers
            case ContractNegotiationPoint.DEADLINE:
                return term.playerValue >= term.clientValue; // Player wants more or equal time
            case ContractNegotiationPoint.CREATIVE_FREEDOM:
                 return term.playerValue <= term.clientValue; // Player wants less or equal freedom (client perspective)
            default: return true;
        }
      });

      if (allMatched) {
         contract.isAccepted = true;
         contract.acceptedTerms = newTerms.map(t => ({...t, clientValue: t.playerValue})); // Player offer becomes the accepted term
         return { status: 'accepted', newTerms: contract.acceptedTerms };
      }

      return { status: 'counter_offer', newTerms, message: 'Client has a counter-offer.' };
    }
  }

  acceptContract(contractId: ProjectId): boolean {
    const contract = this.availableContracts.get(contractId);
    if (contract && !contract.isAccepted) {
        // Final check if current terms are acceptable (e.g. after a counter-offer)
        const termsAreSet = contract.negotiationPoints.every(term => term.playerValue !== undefined && term.clientValue !== undefined);
        if(termsAreSet) { // Simplified: assume player accepts client's last stance
            contract.isAccepted = true;
            contract.acceptedTerms = contract.negotiationPoints.map(t => ({...t, playerValue: t.clientValue}));
            // Remove from available, move to active projects (handled by ProjectManagementService)
            // this.availableContracts.delete(contractId);
            return true;
        }
    }
    return false;
  }

  getContract(contractId: ProjectId): AdvancedContract | undefined {
    return this.availableContracts.get(contractId);
  }

  getAvailableContracts(): AdvancedContract[] {
    return Array.from(this.availableContracts.values()).filter(c => !c.isAccepted && c.expirationDate > /* currentGameTime */ 0);
  }
}

/*
UI for Negotiation (Conceptual):

// src/components/ContractNegotiationModal.tsx
import React, { useState, useEffect } from 'react';
import { AdvancedContract, ContractNegotiationOffer, ContractNegotiationPoint, advancedContractServiceInstance } from '../services'; // Assuming singleton

interface Props {
  contract: AdvancedContract;
  onClose: () => void;
  onContractAccepted: (acceptedContract: AdvancedContract) => void;
}

export function ContractNegotiationModal({ contract, onClose, onContractAccepted }: Props) {
  const [currentTerms, setCurrentTerms] = useState<ContractNegotiationOffer[]>(contract.negotiationPoints);
  const [negotiationMessage, setNegotiationMessage] = useState<string>('');
  const [offerCount, setOfferCount] = useState(contract.playerCounterOfferCount || 0);

  const handleTermChange = (point: ContractNegotiationPoint, playerValue: number) => {
    setCurrentTerms(prevTerms => 
      prevTerms.map(term => term.point === point ? { ...term, playerValue } : term)
    );
  };

  const submitOffer = async () => {
    const playerOffers = currentTerms.map(term => ({ point: term.point, value: term.playerValue }));
    // const result = advancedContractServiceInstance.negotiateContract(contract.id, playerOffers);
    // setNegotiationMessage(result.message || '');
    // if (result.status === 'accepted' && result.newTerms) {
    //   onContractAccepted({ ...contract, acceptedTerms: result.newTerms, isAccepted: true });
    // } else if (result.status === 'counter_offer' && result.newTerms) {
    //   setCurrentTerms(result.newTerms);
    //   setOfferCount(prev => prev + 1);
    // } else if (result.status === 'rejected') {
    //   // Handle rejection, maybe close modal after a delay
    // }
  };
  
  const acceptClientOffer = () => {
    // const acceptedContract = { ...contract, acceptedTerms: currentTerms.map(t => ({...t, playerValue: t.clientValue})), isAccepted: true };
    // advancedContractServiceInstance.acceptContract(contract.id); // This should use the current clientValues as accepted
    // onContractAccepted(acceptedContract);
  };

  return (
    <div>
      <h3>Negotiate: {contract.title}</h3>
      <p>Offered by: {contract.offeredBy}</p>
      <p>Offers remaining: {3 - offerCount}</p>
      {currentTerms.map(term => (
        <div key={term.point}>
          <label>{term.point}: </label>
          {term.locked ? (
            <span>{term.clientValue} (Locked)</span>
          ) : (
            <input 
              type="number" 
              value={term.playerValue} 
              onChange={e => handleTermChange(term.point, parseFloat(e.target.value))}
              min={term.playerMin} // UI hint, actual validation in service
              max={term.playerMax}
            />
          )}
          <span> (Client offers: {term.clientValue})</span>
        </div>
      ))}
      <button onClick={submitOffer} disabled={offerCount >= 3}>Submit Offer</button>
      <button onClick={acceptClientOffer}>Accept Client's Current Offer</button>
      <button onClick={onClose}>Close</button>
      {negotiationMessage && <p>{negotiationMessage}</p>}
    </div>
  );
}
*/
