# Setting all environment variables for the venv
let path-name = (if ((sys).host.name == "Windows") { "Path" } { "PATH" })
let virtual-env = "C:\Users\Brooks.he\PycharmProjects\graphengine-alg-server-general\venv"
let bin = "Scripts"
let path-sep = ";"

let old-path = ($nu.path | str collect ($path-sep))

let venv-path = ([$virtual-env $bin] | path join)
let new-path = ($nu.path | prepend $venv-path | str collect ($path-sep))

# environment variables that will be batched loaded to the virtual env
let new-env = ([
    [name, value];
    [$path-name $new-path]
    [_OLD_VIRTUAL_PATH $old-path]
    [VIRTUAL_ENV $virtual-env]
])

load-env $new-env

# Creating the new prompt for the session
let virtual_prompt = (if ("" != "") {
    "() "
} {
    (build-string '(' ($virtual-env | path basename) ') ')
}
)

# If there is no default prompt, then only the env is printed in the prompt
let new_prompt = (if ( config | select prompt | empty? ) {
    ($"build-string '($virtual_prompt)'")
} {
    ($"build-string '($virtual_prompt)' (config get prompt | str find-replace "build-string" "")")
})
let-env PROMPT_COMMAND = $new_prompt

# We are using alias as the function definitions because only aliases can be
# removed from the scope
alias pydoc = python -m pydoc
alias deactivate = source "C:\Users\Brooks.he\PycharmProjects\graphengine-alg-server-general\venv\Scripts\deactivate.nu"
