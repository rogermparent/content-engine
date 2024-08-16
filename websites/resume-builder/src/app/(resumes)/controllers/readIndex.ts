import { join } from "path";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";
import { open } from "lmdb";

async function readResumeIndex() {
  const resumeDirectory = join(getContentDirectory(), "resumes");
  const resumeIndexDirectory = join(resumeDirectory, "index");
  const db = open({ path: resumeIndexDirectory });
  const resumes = db.getRange().asArray;
  db.close();
  return resumes;
}

export default readResumeIndex;
