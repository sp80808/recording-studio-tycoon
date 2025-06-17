using System;
using System.Collections.Generic;
using UnityEngine;

namespace RecordingStudioTycoon_UnityPoC.Assets.Scripts.DataModels
{
    [System.Serializable]
    public class ContractHistory
    {
        public string EntityId { get; private set; }
        public List<Contract> CompletedContracts { get; private set; }
        public List<Contract> FailedContracts { get; private set; }

        public ContractHistory(string entityId)
        {
            EntityId = entityId;
            CompletedContracts = new List<Contract>();
            FailedContracts = new List<Contract>();
        }

        public void AddCompletedContract(Contract contract)
        {
            if (contract.Status == ContractStatus.Completed)
            {
                CompletedContracts.Add(contract);
            }
            else
            {
                Debug.LogWarning($"Attempted to add non-completed contract to completed history for entity {EntityId}. Contract ID: {contract.ContractId}");
            }
        }

        public void AddFailedContract(Contract contract)
        {
            if (contract.Status == ContractStatus.Failed)
            {
                FailedContracts.Add(contract);
            }
            else
            {
                Debug.LogWarning($"Attempted to add non-failed contract to failed history for entity {EntityId}. Contract ID: {contract.ContractId}");
            }
        }

        public int GetTotalCompletedContracts()
        {
            return CompletedContracts.Count;
        }

        public int GetTotalFailedContracts()
        {
            return FailedContracts.Count;
        }

        public float GetAveragePaymentFromCompletedContracts()
        {
            if (CompletedContracts.Count == 0) return 0f;
            float totalPayment = 0;
            foreach (var contract in CompletedContracts)
            {
                totalPayment += contract.ActualPayment;
            }
            return totalPayment / CompletedContracts.Count;
        }

        public float GetAverageRoyaltyFromCompletedContracts()
        {
            if (CompletedContracts.Count == 0) return 0f;
            float totalRoyalty = 0;
            foreach (var contract in CompletedContracts)
            {
                totalRoyalty += contract.ActualRoyaltyEarned;
            }
            return totalRoyalty / CompletedContracts.Count;
        }
    }
}