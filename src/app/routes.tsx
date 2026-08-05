import { createHashRouter } from "react-router";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { MovieDetail } from "./pages/MovieDetail";
import { Search } from "./pages/Search";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { History } from "./pages/History";
import { MyList } from "./pages/MyList";
import { PersonDetail } from "./pages/PersonDetail";
import { Header } from "./components/Header";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

export const router = createHashRouter([
  {
    path: "/",
    element: (
      <Layout>
        <Home />
      </Layout>
    )
  },
  {
    path: "/browse",
    element: (
      <Layout>
        <Browse />
      </Layout>
    )
  },
  {
    path: "/search",
    element: (
      <Layout>
        <Search />
      </Layout>
    )
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <SignUp />
  },
  {
    path: "/history",
    element: (
      <Layout>
        <History />
      </Layout>
    )
  },
  {
    path: "/mylist",
    element: (
      <Layout>
        <MyList />
      </Layout>
    )
  },
  {
    path: "/person/:id",
    element: (
      <Layout>
        <PersonDetail />
      </Layout>
    )
  },
  {
    path: "/:type/:id",
    element: (
      <Layout>
        <MovieDetail />
      </Layout>
    )
  },
  {
    path: "*",
    element: (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-black text-white mb-4">404</h1>
            <p className="text-gray-400 text-xl">Page not found</p>
          </div>
        </div>
      </Layout>
    )
  }
]);
