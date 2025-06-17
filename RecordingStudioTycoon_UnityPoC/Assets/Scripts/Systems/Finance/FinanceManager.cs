using UnityEngine;
using System;
using RecordingStudioTycoon.GameLogic; // For GameManager and GameState

namespace RecordingStudioTycoon.Systems.Finance
{
    public class FinanceManager : MonoBehaviour
    {
        public static FinanceManager Instance { get; private set; }

        // Event for when money changes, so UI can update
        public event Action<int> OnMoneyChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
            }
            else
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
        }

        // This method should be called by GameManager or a central game loop
        public void ProcessDailyFinances(int currentDay)
        {
            Debug.Log($"FinanceManager: Processing daily finances for day {currentDay}");
            // Example: Deduct daily staff salaries
            DeductStaffSalaries(currentDay);
            // Example: Process daily expenses from studio upgrades, rent, etc.
            // ProcessDailyExpenses(currentDay);
            // Example: Process daily income from passive sources
            // ProcessDailyIncome(currentDay);
        }

        public void AddMoney(int amount, string reason = "General Income")
        {
            if (GameManager.Instance == null) return;

            GameManager.Instance.CurrentGameState.money += amount;
            Debug.Log($"Added {amount} money. Reason: {reason}. Total: {GameManager.Instance.CurrentGameState.money}");
            OnMoneyChanged?.Invoke(GameManager.Instance.CurrentGameState.money);
            GameManager.Instance.UpdateGameState(GameManager.Instance.CurrentGameState); // Notify GameManager of state change
        }

        public bool DeductMoney(int amount, string reason = "General Expense")
        {
            if (GameManager.Instance == null) return false;

            if (GameManager.Instance.CurrentGameState.money >= amount)
            {
                GameManager.Instance.CurrentGameState.money -= amount;
                Debug.Log($"Deducted {amount} money. Reason: {reason}. Total: {GameManager.Instance.CurrentGameState.money}");
                OnMoneyChanged?.Invoke(GameManager.Instance.CurrentGameState.money);
                GameManager.Instance.UpdateGameState(GameManager.Instance.CurrentGameState); // Notify GameManager of state change
                return true;
            }
            else
            {
                Debug.LogWarning($"Insufficient funds to deduct {amount} for {reason}. Current money: {GameManager.Instance.CurrentGameState.money}");
                // TODO: Trigger UI notification for insufficient funds
                return false;
            }
        }

        private void DeductStaffSalaries(int currentDay)
        {
            if (GameManager.Instance == null || GameManager.Instance.CurrentGameState.hiredStaff == null) return;

            // Assuming salaries are paid weekly (e.g., every 7 days)
            if (currentDay > 0 && currentDay % 7 == 0)
            {
                int totalSalaries = 0;
                foreach (var staff in GameManager.Instance.CurrentGameState.hiredStaff)
                {
                    totalSalaries += staff.salary;
                }

                if (totalSalaries > 0)
                {
                    Debug.Log($"Attempting to deduct weekly salaries: {totalSalaries}");
                    if (DeductMoney(totalSalaries, "Weekly Staff Salaries"))
                    {
                        Debug.Log($"Successfully deducted {totalSalaries} for staff salaries.");
                    }
                    else
                    {
                        Debug.LogError($"Failed to deduct staff salaries. Not enough money!");
                        // Handle consequences of not paying salaries (e.g., staff mood decrease, leave)
                    }
                }
            }
        }

        // You can add more specific financial methods here, e.g.:
        // public void ProcessProjectPayout(Project project) { ... }
        // public void HandleEquipmentPurchase(Equipment equipment) { ... }
        // public void HandleStudioExpansionCost(Expansion expansion) { ... }
    }
}