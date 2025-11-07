const team = [
  {
    name: "Assaf Arkin",
    role: "CEO & Co-founder",
    description:
      "Repeat founder with years of experience working with LLMs and serving SMBs.",
    image: "/images/team/avatar-assaf.jpg",
  },
  {
    name: "Jon Sofield",
    role: "Chief Marketplace Officer",
    description:
      "Scaled Google My Business to 100+ million users, VP of Business Development at several startups.",
    image: "/images/team/avatar-jon.jpg",
  },
  {
    name: "Alex Storey",
    role: "Chief Sales Officer",
    description:
      "From channel growth at Google to starting multiple companies in the proptech space.",
    image: "/images/team/avatar-alex.jpg",
  },
];

export default function AboutTeam() {
  return (
    <section className="bg-gray-50 px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-4xl text-gray-900">
            Meet the Team
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600 text-xl">
            We're a diverse team of retail experts, technologists, and
            entrepreneurs
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm"
            >
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-indigo-100">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full rounded-full"
                />
              </div>
              <h3 className="mb-1 font-bold text-gray-900 text-xl">
                {member.name}
              </h3>
              <p className="mb-3 font-medium text-blue-600 text-sm">
                {member.role}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
