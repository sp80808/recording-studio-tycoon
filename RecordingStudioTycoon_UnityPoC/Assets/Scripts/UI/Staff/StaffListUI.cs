using UnityEngine;
using UnityEngine.UIElements;
using System.Linq;

using RecordingStudioTycoon.Systems.Staff;

public class StaffListUI : MonoBehaviour
{
    [SerializeField] private UIDocument uiDocument;
    [SerializeField] private StaffManager staffManager;
    [SerializeField] private VisualTreeAsset staffCardTemplate;

    private VisualElement root;
    private VisualElement staffListContainer;

    void OnEnable()
    {
        root = uiDocument.rootVisualElement;
        staffListContainer = root.Q<VisualElement>("staff-list-container");

        staffManager.OnStaffChanged += RefreshStaffList;
        RefreshStaffList();
    }

    void OnDisable()
    {
        staffManager.OnStaffChanged -= RefreshStaffList;
    }

    private void RefreshStaffList()
    {
        staffListContainer.Clear();

        foreach (var staff in staffManager.CurrentStaff.OrderBy(s => s.staffType))
        {
            var card = staffCardTemplate.Instantiate();
            var cardUI = new StaffCardUI(card, staff);
            staffListContainer.Add(card);
        }
    }
}
