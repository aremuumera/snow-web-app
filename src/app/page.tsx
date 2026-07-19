import { redirect } from "next/navigation";
import { paths } from "@/utils/paths";

export default function Home() {
  redirect(paths.auth.login);
}
