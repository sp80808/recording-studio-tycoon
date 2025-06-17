using UnityEngine;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Systems.Finance
{
    public class FinanceManager : MonoBehaviour
    {
        public static FinanceManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void ProcessDailyFinances(int currentDay)
        {
            if (GameManager.Instance == null) return;

            var gameState = GameManager.Instance.CurrentGameState;

            // Calculate daily expenses
            int dailyExpenses = CalculateDailyExpenses(gameState);
            
            // Apply daily expenses
            gameState.money -= dailyExpenses;

            // Process staff salaries
            ProcessStaffSalaries(gameState);

            // Process equipment maintenance
            ProcessEquipmentMaintenance(gameState);

            Debug.Log($"Daily finances processed: -${dailyExpenses} expenses");
        }

        private int CalculateDailyExpenses(GameState gameState)
        {
            int baseExpenses = 50; // Base studio operating costs
            int staffExpenses = gameState.staff.Count * 10; // Staff overhead
            int equipmentExpenses = gameState.equipment.Count * 5; // Equipment maintenance

            return baseExpenses + staffExpenses + equipmentExpenses;
        }

        private void ProcessStaffSalaries(GameState gameState)
        {
            foreach (var staffMember in gameState.staff)
            {
                // For now, just subtract a basic salary amount
                // In a real implementation, this would be based on staff member salary
                gameState.money -= 100; // Base daily salary
            }
        }

        private void ProcessEquipmentMaintenance(GameState gameState)
        {
            foreach (var equipment in gameState.equipment)
            {
                // Basic equipment maintenance cost
                gameState.money -= 5;
            }
        }

        public void AddRevenue(int amount, string source = "")
        {
            if (GameManager.Instance == null) return;

            var gameState = GameManager.Instance.CurrentGameState;
            gameState.money += amount;

            Debug.Log($"Revenue added: +${amount} from {source}");
        }

        public bool CanAfford(int cost)
        {
            if (GameManager.Instance == null) return false;
            return GameManager.Instance.CurrentGameState.money >= cost;
        }

        public bool SpendMoney(int amount, string purpose = "")
        {
            if (!CanAfford(amount)) return false;

            var gameState = GameManager.Instance.CurrentGameState;
            gameState.money -= amount;

            Debug.Log($"Money spent: -${amount} for {purpose}");
            return true;
        }
    }
}
