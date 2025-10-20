import "./App.css";
import { Button } from "@/components/ui/button";

function App() {
  return (
    // testing
    <div className="flex h-screen items-center justify-center">
      <div className="flex-direction flex-col items-center gap-8">
        <p className="font-bold text-9xl">Mazadak</p>
        <Button className="py-6 px-60 my-4">Click me</Button>
      </div>
    </div>
  );
}

export default App;
