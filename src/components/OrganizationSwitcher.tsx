// TEMPORARY DEBUG VERSION - Replace OrganizationSwitcher temporarily

export default function OrganizationSwitcher() {
  return (
    <div 
      className="w-full bg-red-500 border-4 border-yellow-400 p-4"
      style={{ 
        minHeight: "100px",
        backgroundColor: "red !important",
        border: "4px solid yellow !important"
      }}
    >
      <div className="text-white text-lg font-bold">
        DEBUG: Can you see this red box?
      </div>
      <button 
        className="bg-blue-500 text-white p-2 mt-2 w-full"
        onClick={() => alert("Button clicked!")}
      >
        Test Button - Click Me
      </button>
    </div>
  );
}