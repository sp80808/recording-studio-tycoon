import { money } from '@/utils/displayMoney';
import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import {
  ArtistProspect, ContractTerms, canSign, evaluateOffer, NegotiationOutcome, processContractsDay, signArtist,
} from '@/simulation/artistContracts';

const toastStyle = "bg-stone-800 border-stone-600 text-white";

export const useArtistContracts = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  /** Pay the advance and add the artist to the roster. */
  const signContract = useCallback((prospect: ArtistProspect, terms: ContractTerms) => {
    const roster = gameState.signedArtists ?? [];
    const check = canSign(roster, gameState.money, terms);
    if (!check.ok) {
      toast({ title: "🖊️ Can't Sign", description: check.reason, className: toastStyle, variant: "destructive" });
      return false;
    }
    setGameState(prev => ({
      ...prev,
      money: prev.money - terms.advance,
      signedArtists: [...(prev.signedArtists ?? []), signArtist(prospect, terms, prev.currentDay)],
      playerData: { ...prev.playerData, xp: prev.playerData.xp + 25 },
    }));
    toast({
      title: "🖊️ Artist Signed",
      description: `${prospect.name} signed for ${terms.durationDays} days. Advance paid: ${money(terms.advance)}.`,
      className: toastStyle,
      duration: 4000,
    });
    return true;
  }, [gameState.signedArtists, gameState.money, setGameState]);

  /** Put an offer to a prospect; signs on acceptance, otherwise returns the outcome for the UI. */
  const makeOffer = useCallback((prospect: ArtistProspect, offer: ContractTerms): NegotiationOutcome => {
    const outcome = evaluateOffer(
      prospect, offer, gameState.playerData.attributes.businessAcumen, gameState.reputation
    );
    if (outcome.result === 'accepted') {
      signContract(prospect, offer);
    } else if (outcome.result === 'rejected') {
      if (outcome.insulted) {
        setGameState(prev => ({
          ...prev,
          reputation: Math.max(0, prev.reputation - 1),
          passedProspects: [...(prev.passedProspects ?? []), prospect.id],
        }));
        toast({ title: "😤 Insulted", description: `${prospect.name} walked out on that offer. Word gets around (-1 reputation).`, className: toastStyle, variant: "destructive" });
      } else {
        toast({ title: "🙅 Declined", description: `${prospect.name} isn't interested at those terms.`, className: toastStyle });
      }
    }
    return outcome;
  }, [gameState.playerData.attributes.businessAcumen, gameState.reputation, signContract, setGameState]);

  const passOnProspect = useCallback((prospectId: string) => {
    setGameState(prev => ({ ...prev, passedProspects: [...(prev.passedProspects ?? []), prospectId] }));
  }, [setGameState]);

  /** Daily royalties and expiry; call once per advanced day. */
  const processContracts = useCallback(() => {
    const roster = gameState.signedArtists ?? [];
    if (roster.length === 0) return;
    const result = processContractsDay(roster, gameState.currentDay);
    setGameState(prev => ({ ...prev, signedArtists: result.roster, money: prev.money + result.income }));
    result.expired.forEach(artist => {
      toast({
        title: "📄 Contract Ended",
        description: `${artist.name}'s deal is up after earning you ${money(artist.totalEarned)}.`,
        className: toastStyle,
        duration: 4000,
      });
    });
  }, [gameState.signedArtists, gameState.currentDay, setGameState]);

  return { signContract, makeOffer, passOnProspect, processContracts };
};
