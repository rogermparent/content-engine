"use client";

import { useEffect, useMemo, useState } from "react";
import slugify from "@sindresorhus/slugify";
import { Resume } from "@/controller/types";
import { ResumeFormState } from "@/controller/formState";
import createDefaultSlug from "@/controller/createSlug";
import { ProjectsListInput } from "@/components/Resume/Form/Projects";
import { EducationListInput } from "@/components/Resume/Form/Education";
import { ExperienceListInput } from "@/components/Resume/Form/Experience";
import { TextInput } from "component-library/components/Form/inputs/Text";
import { TextListInput } from "component-library/components/Form/inputs/List";
import { DateTimeInput } from "component-library/components/Form/inputs/DateTime";

export default function UpdateResumeFields({
  resume,
  slug,
  state,
}: {
  resume?: Partial<Resume>;
  slug?: string;
  state: ResumeFormState;
}) {
  const {
    company,
    job,
    date,
    skills,
    projects,
    education,
    experience,
    address,
    email,
    github,
    linkedin,
    name,
    phone,
    website,
  } = resume || {};
  const [currentCompany, setCurrentCompany] = useState(company);
  const [currentJob, setCurrentJob] = useState(job);
  const defaultSlug = useMemo(
    () => createDefaultSlug({ company: currentCompany, job: currentJob }),
    [currentCompany, currentJob],
  );
  const [currentTimezone, setCurrentTimezone] = useState<string>();
  useEffect(() => {
    const fetchedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setCurrentTimezone(fetchedTimezone);
  }, []);
  return (
    <>
      <TextInput
        label="Company"
        name="company"
        id="resume-form-company"
        defaultValue={company}
        onChange={(e) => setCurrentCompany(slugify(e.target.value))}
        errors={state.errors?.company}
      />
      <TextInput
        label="Job"
        name="job"
        id="resume-form-job"
        defaultValue={job}
        onChange={(e) => setCurrentJob(slugify(e.target.value))}
        errors={state.errors?.job}
      />
      <TextListInput
        label="Skills"
        name="skills"
        id="resume-form-skills"
        defaultValue={skills}
        appendLabel="Append Skill"
      />
      <ProjectsListInput
        label="Projects"
        name="projects"
        id="resume-form-projects"
        defaultValue={projects}
      />
      <EducationListInput
        label="Education"
        name="education"
        id="resume-form-education"
        defaultValue={education}
      />
      <ExperienceListInput
        label="Experience"
        name="experience"
        id="resume-form-experience"
        defaultValue={experience}
      />
      <details className="py-1 my-1">
        <summary className="text-sm font-semibold">Applicant</summary>
        <div className="flex flex-col flex-nowrap">
          <TextInput
            label="Name"
            name="name"
            id="resume-form-name"
            defaultValue={name}
            errors={state.errors?.name}
          />
          <TextInput
            label="Email"
            name="email"
            id="resume-form-email"
            defaultValue={email}
            errors={state.errors?.email}
          />
          <TextInput
            label="Address"
            name="address"
            id="resume-form-address"
            defaultValue={address}
            errors={state.errors?.address}
          />
          <TextInput
            label="Github"
            name="github"
            id="resume-form-github"
            defaultValue={github}
            errors={state.errors?.github}
          />
          <TextInput
            label="LinkedIn"
            name="linkedin"
            id="resume-form-linkedin"
            defaultValue={linkedin}
            errors={state.errors?.linkedin}
          />
          <TextInput
            label="Phone"
            name="phone"
            id="resume-form-phone"
            defaultValue={phone}
            errors={state.errors?.phone}
          />
          <TextInput
            label="Website"
            name="website"
            id="resume-form-website"
            defaultValue={website}
            errors={state.errors?.website}
          />
        </div>
      </details>
      <details className="py-1 my-1">
        <summary className="text-sm font-semibold">Advanced</summary>
        <div className="flex flex-col flex-nowrap">
          <TextInput
            label="Slug"
            name="slug"
            id="resume-form-slug"
            defaultValue={slug}
            placeholder={defaultSlug}
            errors={state.errors?.slug}
          />
          <DateTimeInput
            label="Date (UTC)"
            name="date"
            id="resume-form-date"
            date={date}
            currentTimezone={currentTimezone}
            errors={state.errors?.date}
          />
        </div>
      </details>
    </>
  );
}
