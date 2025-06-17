using System;
using UnityEngine;

namespace RecordingStudioTycoon_UnityPoC.Assets.Scripts.DataModels
{
    [System.Serializable]
    public class Contract
    {
        public string ContractId { get; private set; }
        public string EntityId { get; private set; } // ID of the Artist, Client, or RecordLabel
        public string ProjectId { get; private set; } // ID of the project associated with this contract
        public ContractType Type { get; private set; }
        public ContractStatus Status { get; private set; }
        public float AgreedPayment { get; private set; }
        public float AgreedRoyaltyPercentage { get; private set; } // For artists/labels
        public DateTime StartDate { get; private set; }
        public DateTime EndDate { get; private set; }
        public int DurationInDays { get; private set; }
        public string TermsAndConditions { get; private set; }
        public DateTime? CompletionDate { get; private set; }
        public float ActualPayment { get; private set; }
        public float ActualRoyaltyEarned { get; private set; }

        public Contract(string entityId, string projectId, ContractType type, float agreedPayment, float agreedRoyaltyPercentage, int durationInDays, string termsAndConditions)
        {
            ContractId = Guid.NewGuid().ToString();
            EntityId = entityId;
            ProjectId = projectId;
            Type = type;
            AgreedPayment = agreedPayment;
            AgreedRoyaltyPercentage = agreedRoyaltyPercentage;
            StartDate = DateTime.Now;
            DurationInDays = durationInDays;
            EndDate = StartDate.AddDays(durationInDays);
            TermsAndConditions = termsAndConditions;
            Status = ContractStatus.Active;
            CompletionDate = null;
            ActualPayment = 0;
            ActualRoyaltyEarned = 0;
        }

        public void CompleteContract(float actualPayment, float actualRoyaltyEarned)
        {
            Status = ContractStatus.Completed;
            CompletionDate = DateTime.Now;
            ActualPayment = actualPayment;
            ActualRoyaltyEarned = actualRoyaltyEarned;
        }

        public void FailContract()
        {
            Status = ContractStatus.Failed;
            CompletionDate = DateTime.Now;
            ActualPayment = 0;
            ActualRoyaltyEarned = 0;
        }
    }

    public enum ContractType
    {
        RecordingProject,
        MixingProject,
        MasteringProject,
        DistributionDeal,
        ManagementContract,
        SessionWork
    }

    public enum ContractStatus
    {
        Active,
        Completed,
        Failed,
        Cancelled
    }
}